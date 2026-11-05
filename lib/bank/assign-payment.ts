import { prisma } from "@/lib/prisma";
import { applyReceiptPayment } from "./apply-payment";
import { afterReceiptPaid } from "./after-receipt-paid";

export async function assignPaymentToReceipt(
  tenantId: string,
  paymentId: string,
  receiptId: string
): Promise<{ becamePaid: boolean }> {
  let becamePaid = false;
  let voucherActivatedId: string | null = null;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: paymentId,
        tenantId,
        matched: false,
        receiptId: null,
        invoiceId: null,
      },
    });
    if (!payment) {
      throw new Error("Platba není k dispozici pro přiřazení.");
    }

    const receipt = await tx.receipt.findFirst({
      where: { id: receiptId, tenantId, stornedAt: null },
      select: { id: true },
    });
    if (!receipt) {
      throw new Error("Účtenka nenalezena nebo je stornovaná.");
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: { receiptId, matched: true },
    });

    const result = await applyReceiptPayment(tx, tenantId, receiptId);
    becamePaid = result.becamePaid;
    voucherActivatedId = result.voucherActivatedId;
  });

  if (becamePaid) {
    await afterReceiptPaid(tenantId, receiptId, voucherActivatedId);
  }

  return { becamePaid };
}
