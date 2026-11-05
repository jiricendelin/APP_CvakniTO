"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { assignPaymentToReceipt } from "@/lib/bank/assign-payment";
import { formatCzk } from "@/lib/money";

export type AssignPaymentState = {
  error?: string;
  success?: string;
};

export async function assignPaymentAction(
  _prev: AssignPaymentState,
  formData: FormData
): Promise<AssignPaymentState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const paymentId = String(formData.get("paymentId") ?? "").trim();
  if (!paymentId) {
    return { error: "Chybí platba." };
  }

  let receiptId = String(formData.get("receiptId") ?? "").trim();
  const receiptRef = String(formData.get("receiptRef") ?? "").trim();

  const tenantId = await getTenantId();

  if (!receiptId && receiptRef) {
    const ref = receiptRef.replace(/\D/g, "");
    const receipt = await prisma.receipt.findFirst({
      where: {
        tenantId,
        OR: [{ variableSymbol: ref }, { number: receiptRef.trim() }],
      },
      select: { id: true, totalCents: true },
    });
    if (!receipt) {
      return { error: "Účtenka podle VS nebo čísla nenalezena." };
    }
    receiptId = receipt.id;
  }

  if (!receiptId) {
    return { error: "Zadejte VS nebo číslo účtenky." };
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId },
    select: { amountCents: true },
  });
  if (!payment) {
    return { error: "Platba nenalezena." };
  }

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { totalCents: true, paidAt: true },
  });
  if (!receipt) {
    return { error: "Účtenka nenalezena." };
  }

  try {
    const { becamePaid } = await assignPaymentToReceipt(
      tenantId,
      paymentId,
      receiptId
    );

    revalidatePath("/payments");
    revalidatePath("/receipts");
    revalidatePath("/vouchers");

    if (becamePaid) {
      return { success: "Platba přiřazena, účtenka je zaplacená." };
    }

    const agg = await prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { tenantId, receiptId },
    });
    const sum = agg._sum.amountCents ?? 0;
    const missing = Math.max(0, receipt.totalCents - sum);
    if (missing > 0) {
      return {
        success: `Platba přiřazena, ale ještě chybí ${formatCzk(missing)}.`,
      };
    }

    return { success: "Platba přiřazena." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Přiřazení se nepodařilo.",
    };
  }
}
