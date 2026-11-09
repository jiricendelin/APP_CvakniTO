"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { parseCzkInput } from "@/lib/money";
import {
  isVoucherStatus,
  VOUCHER_STATUSES,
} from "@/lib/vouchers/status";
import { addMonthsPrague } from "@/lib/time/prague-parts";
import { resolveRecipientName } from "@/lib/vouchers/resolve-recipient";

export type VoucherActionState = {
  error?: string;
  success?: string;
  voucherId?: string;
};

export async function updateVoucherStatusAction(
  _prev: VoucherActionState,
  formData: FormData
): Promise<VoucherActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return { error: "Chybí ID poukazu." };
  if (!isVoucherStatus(status)) return { error: "Neplatný stav." };

  const tenantId = await getTenantId();
  const row = await prisma.voucher.findFirst({
    where: { id, tenantId },
    select: { id: true, status: true },
  });
  if (!row) return { error: "Poukaz nenalezen." };
  if (status === "zaplaceny" && row.status !== "zaplaceny") {
    return { error: "Zaplacený nastavíte přiřazením platby." };
  }

  await prisma.voucher.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/vouchers");
  revalidatePath(`/vouchers/${id}`);
  return { success: "Stav uložen." };
}

export async function extendVoucherAction(
  _prev: VoucherActionState,
  formData: FormData
): Promise<VoucherActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID poukazu." };

  const monthsRaw = String(formData.get("months") ?? "6");
  const months = parseInt(monthsRaw, 10);
  if (!Number.isFinite(months) || months < 1 || months > 36) {
    return { error: "Zadejte počet měsíců (1–36)." };
  }

  const dateRaw = String(formData.get("validUntil") ?? "").trim();
  const tenantId = await getTenantId();
  const row = await prisma.voucher.findFirst({
    where: { id, tenantId },
    include: { receipt: { select: { paidAt: true } } },
  });
  if (!row) return { error: "Poukaz nenalezen." };

  let validUntil: Date;
  if (dateRaw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateRaw);
    if (!m) return { error: "Neplatné datum." };
    validUntil = new Date(
      Date.UTC(
        parseInt(m[1]!, 10),
        parseInt(m[2]!, 10) - 1,
        parseInt(m[3]!, 10)
      )
    );
  } else {
    const base =
      row.validUntil.getTime() > Date.now() ? row.validUntil : new Date();
    validUntil = addMonthsPrague(base, months);
  }

  const data: { validUntil: Date; status?: string } = { validUntil };
  if (row.status === "propadly") {
    data.status = row.receipt?.paidAt ? "zaplaceny" : "vystaveny";
  }

  await prisma.voucher.update({ where: { id }, data });

  revalidatePath("/vouchers");
  revalidatePath(`/vouchers/${id}`);
  return { success: "Platnost prodloužena." };
}

export async function updateVoucherFieldsAction(
  _prev: VoucherActionState,
  formData: FormData
): Promise<VoucherActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID poukazu." };

  const schema = z.object({
    buyerName: z.string().trim().min(1).max(200),
    recipientName: z.string().trim().max(200),
    recipientGiftCustomerId: z.union([z.string().uuid(), z.literal("")]).optional(),
    buyerEmail: z.string().max(200).optional().default(""),
    note: z.string().max(2000).optional().default(""),
  });

  const parsed = schema.safeParse({
    buyerName: formData.get("buyerName"),
    recipientName: formData.get("recipientName"),
    recipientGiftCustomerId: formData.get("recipientGiftCustomerId"),
    buyerEmail: formData.get("buyerEmail"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const tenantId = await getTenantId();
  const row = await prisma.voucher.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!row) return { error: "Poukaz nenalezen." };

  const giftPickId =
    parsed.data.recipientGiftCustomerId?.trim() || null;
  const recipientName = await resolveRecipientName(
    tenantId,
    parsed.data.recipientName,
    giftPickId
  );

  await prisma.voucher.update({
    where: { id },
    data: {
      buyerName: parsed.data.buyerName,
      recipientName,
      buyerEmail: parsed.data.buyerEmail.trim(),
      note: parsed.data.note.trim(),
    },
  });

  revalidatePath(`/vouchers/${id}`);
  revalidatePath("/vouchers");
  return { success: "Uloženo." };
}

export { VOUCHER_STATUSES };
