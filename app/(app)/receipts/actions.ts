"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { canModifyReceipt } from "@/lib/receipts/eet-status";

export type ReceiptActionState = { error?: string; success?: boolean };

async function loadEditableReceipt(tenantId: string, receiptId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    include: { items: true },
  });
  if (!receipt) return null;
  if (!canModifyReceipt(receipt.eetStatus)) return null;
  return receipt;
}

export async function deleteReceiptAction(formData: FormData): Promise<void> {
  try {
    await assertCsrf(formData);
  } catch {
    throw new Error("Neplatný CSRF token. Obnovte stránku.");
  }

  const receiptId = String(formData.get("receiptId") ?? "");
  if (!receiptId) throw new Error("Chybí ID účtenky.");

  const tenantId = await getTenantId();
  const receipt = await loadEditableReceipt(tenantId, receiptId);
  if (!receipt) {
    throw new Error(
      "Účtenku nelze smazat (nenalezena nebo už odeslaná do EET)."
    );
  }

  await prisma.receipt.delete({ where: { id: receipt.id } });
  revalidatePath("/receipts");
  redirect("/receipts");
}

const updateItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(999),
});

export async function updateReceiptItemsAction(
  _prev: ReceiptActionState,
  formData: FormData
): Promise<ReceiptActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const receiptId = String(formData.get("receiptId") ?? "");
  if (!receiptId) return { error: "Chybí ID účtenky." };

  const tenantId = await getTenantId();
  const receipt = await loadEditableReceipt(tenantId, receiptId);
  if (!receipt) {
    return {
      error: "Účtenku nelze upravit (nenalezena nebo už odeslaná do EET).",
    };
  }

  const knownIds = new Set(receipt.items.map((i) => i.id));
  const updates: { id: string; quantity: number }[] = [];

  for (const item of receipt.items) {
    const rawQty = formData.get(`qty_${item.id}`);
    const parsed = updateItemSchema.safeParse({ id: item.id, quantity: rawQty });
    if (!parsed.success) {
      return { error: "Neplatné množství u položky." };
    }
    if (!knownIds.has(parsed.data.id)) continue;
    if (parsed.data.quantity > 0) {
      updates.push({ id: parsed.data.id, quantity: parsed.data.quantity });
    }
  }

  if (updates.length === 0) {
    return { error: "Účtenka musí mít alespoň jednu položku." };
  }

  let totalCents = 0;
  const itemUpdates = updates.map((u) => {
    const row = receipt.items.find((i) => i.id === u.id)!;
    const lineTotalCents = row.priceCents * u.quantity;
    totalCents += lineTotalCents;
    return { id: u.id, quantity: u.quantity, lineTotalCents };
  });

  const removeIds = receipt.items
    .filter((i) => !updates.some((u) => u.id === i.id))
    .map((i) => i.id);

  await prisma.$transaction(async (tx) => {
    if (removeIds.length > 0) {
      await tx.receiptItem.deleteMany({
        where: { id: { in: removeIds }, receiptId: receipt.id, tenantId },
      });
    }
    for (const u of itemUpdates) {
      await tx.receiptItem.update({
        where: { id: u.id },
        data: { quantity: u.quantity, lineTotalCents: u.lineTotalCents },
      });
    }
    await tx.receipt.update({
      where: { id: receipt.id },
      data: { totalCents },
    });
  });

  revalidatePath("/receipts");
  revalidatePath(`/receipts/${receipt.id}`);
  revalidatePath(`/receipts/${receipt.id}/edit`);
  return { success: true };
}
