"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { buildReceiptItemSnapshotsFromCart } from "@/lib/receipts/build-cart-snapshots";
import { checkoutCartLineSchema } from "@/lib/receipts/checkout-schema";
import {
  canDeleteReceipt,
  canModifyReceipt,
} from "@/lib/receipts/eet-status";
import { maybeAutoEetAfterReceiptChange } from "@/lib/receipts/maybe-auto-eet";
import {
  isPaymentType,
  PAYMENT_TYPES,
  type PaymentType,
} from "@/lib/receipts/payment-type";

export type ReceiptActionState = { error?: string; success?: boolean };

async function loadEditableReceipt(tenantId: string, receiptId: string) {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    include: { items: true, payments: { select: { id: true } } },
  });
  if (!receipt) return null;
  if (
    !canModifyReceipt({
      eetStatus: receipt.eetStatus,
      paidAt: receipt.paidAt,
      kind: receipt.kind,
    })
  ) {
    return null;
  }
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
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { eetStatus: true, paidAt: true, kind: true, id: true },
  });
  if (
    !receipt ||
    !canDeleteReceipt({
      eetStatus: receipt.eetStatus,
      paidAt: receipt.paidAt,
      kind: receipt.kind,
    })
  ) {
    throw new Error(
      "Účtenku nelze smazat (nenalezena, zaplacená nebo již odeslaná do EET)."
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

function parseNewCartLines(formData: FormData): z.infer<typeof checkoutCartLineSchema>[] {
  const raw = String(formData.get("newCart") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const lines: z.infer<typeof checkoutCartLineSchema>[] = [];
  for (const entry of parsed) {
    const result = checkoutCartLineSchema.safeParse(entry);
    if (result.success) lines.push(result.data);
  }
  return lines;
}

function resolvePaymentTypeChange(
  current: PaymentType,
  next: PaymentType,
  receipt: { paidAt: Date | null; payments: { id: string }[] }
): { paymentType: PaymentType; paidAt: Date | null } | { error: string } {
  if (current === next) {
    return { paymentType: next, paidAt: receipt.paidAt };
  }

  if (next === "hotove") {
    return {
      paymentType: "hotove",
      paidAt: receipt.paidAt ?? new Date(),
    };
  }

  if (receipt.payments.length > 0) {
    return {
      error:
        "Typ platby na QR nelze změnit — na účtence jsou spárované platby z banky.",
    };
  }

  return { paymentType: "qr", paidAt: null };
}

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

  const paymentTypeRaw = String(formData.get("paymentType") ?? "");
  if (!isPaymentType(paymentTypeRaw)) {
    return { error: "Neplatný typ platby." };
  }

  const tenantId = await getTenantId();
  const receipt = await loadEditableReceipt(tenantId, receiptId);
  if (!receipt) {
    return {
      error:
        "Účtenku nelze upravit (nenalezena nebo již odeslaná do EET).",
    };
  }

  const paymentChange = resolvePaymentTypeChange(
    receipt.paymentType as PaymentType,
    paymentTypeRaw,
    { paidAt: receipt.paidAt, payments: receipt.payments }
  );
  if ("error" in paymentChange) {
    return { error: paymentChange.error };
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

  let newSnapshots: Awaited<ReturnType<typeof buildReceiptItemSnapshotsFromCart>>;
  try {
    newSnapshots = await buildReceiptItemSnapshotsFromCart(
      tenantId,
      parseNewCartLines(formData)
    );
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Nepodařilo se přidat položky.",
    };
  }

  if (updates.length === 0 && newSnapshots.length === 0) {
    return { error: "Účtenka musí mít alespoň jednu položku." };
  }

  let totalCents = 0;
  const itemUpdates = updates.map((u) => {
    const row = receipt.items.find((i) => i.id === u.id)!;
    const lineTotalCents = row.priceCents * u.quantity;
    totalCents += lineTotalCents;
    return { id: u.id, quantity: u.quantity, lineTotalCents };
  });

  for (const line of newSnapshots) {
    totalCents += line.lineTotalCents;
  }

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
    if (newSnapshots.length > 0) {
      await tx.receiptItem.createMany({
        data: newSnapshots.map((line) => ({
          tenantId,
          receiptId: receipt.id,
          priceItemId: line.priceItemId,
          name: line.name,
          priceCents: line.priceCents,
          quantity: line.quantity,
          category: line.category,
          lineTotalCents: line.lineTotalCents,
        })),
      });
    }
    await tx.receipt.update({
      where: { id: receipt.id },
      data: {
        totalCents,
        paymentType: paymentChange.paymentType,
        paidAt: paymentChange.paidAt,
      },
    });
  });

  await maybeAutoEetAfterReceiptChange(tenantId, receipt.id);

  revalidatePath("/receipts");
  revalidatePath(`/receipts/${receipt.id}`);
  revalidatePath(`/receipts/${receipt.id}/edit`);
  return { success: true };
}

export async function markReceiptPaidAction(
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
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { id: true, kind: true, paidAt: true, eetStatus: true },
  });
  if (!receipt) return { error: "Účtenka nenalezena." };
  if (receipt.kind !== "bezna") {
    return { error: "Ruční uhrazení je jen u běžných účtenek." };
  }
  if (receipt.eetStatus === "stornovano") {
    return { error: "Stornovanou účtenku nelze označit jako uhrazenou." };
  }
  if (receipt.paidAt) {
    return { error: "Účtenka je už označená jako uhrazená." };
  }

  await prisma.receipt.update({
    where: { id: receipt.id },
    data: { paidAt: new Date() },
  });

  await maybeAutoEetAfterReceiptChange(tenantId, receipt.id);

  revalidatePath("/receipts");
  revalidatePath(`/receipts/${receiptId}`);
  return { success: true };
}

export { PAYMENT_TYPES };
