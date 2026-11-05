import { Prisma } from "@prisma/client";

export type ApplyReceiptPaymentResult = {
  becamePaid: boolean;
  voucherActivatedId: string | null;
};

export async function applyReceiptPayment(
  tx: Prisma.TransactionClient,
  tenantId: string,
  receiptId: string
): Promise<ApplyReceiptPaymentResult> {
  await tx.$executeRaw(
    Prisma.sql`
      SELECT id FROM receipts
      WHERE id = ${receiptId}::uuid AND tenant_id = ${tenantId}::uuid
      FOR UPDATE
    `
  );

  const receipt = await tx.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: {
      totalCents: true,
      kind: true,
      giftCustomerId: true,
    },
  });
  if (!receipt) {
    return { becamePaid: false, voucherActivatedId: null };
  }

  const agg = await tx.payment.aggregate({
    _sum: { amountCents: true },
    where: { tenantId, receiptId },
  });
  const sum = agg._sum.amountCents ?? 0;
  if (sum < receipt.totalCents) {
    return { becamePaid: false, voucherActivatedId: null };
  }

  const paid = await tx.receipt.updateMany({
    where: { id: receiptId, tenantId, paidAt: null },
    data: { paidAt: new Date() },
  });
  if (paid.count === 0) {
    return { becamePaid: false, voucherActivatedId: null };
  }

  let voucherActivatedId: string | null = null;

  if (receipt.kind === "poukaz") {
    const activated = await tx.voucher.updateMany({
      where: { tenantId, receiptId, status: "vystaveny" },
      data: { status: "zaplaceny" },
    });
    if (activated.count === 1) {
      const voucher = await tx.voucher.findFirst({
        where: { tenantId, receiptId },
        select: { id: true },
      });
      voucherActivatedId = voucher?.id ?? null;
    } else {
      const expired = await tx.voucher.findFirst({
        where: { tenantId, receiptId, status: "propadly" },
        select: { id: true },
      });
      if (expired) {
        console.warn(
          "[applyReceiptPayment] poukaz propadlý, neaktivuji",
          expired.id
        );
      }
    }
  }

  if (receipt.kind === "storno" && receipt.giftCustomerId) {
    await tx.giftCustomer.update({
      where: { id: receipt.giftCustomerId },
      data: {
        awaitingStornoPayment: false,
        stornoFeeCents: 0,
      },
    });
  }

  return { becamePaid: true, voucherActivatedId };
}

export async function applyInvoicePayment(
  tx: Prisma.TransactionClient,
  tenantId: string,
  invoiceId: string
): Promise<{ becamePaid: boolean }> {
  const invoice = await tx.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    select: { totalCents: true },
  });
  if (!invoice) {
    return { becamePaid: false };
  }

  const agg = await tx.payment.aggregate({
    _sum: { amountCents: true },
    where: { tenantId, invoiceId },
  });
  const sum = agg._sum.amountCents ?? 0;
  if (sum < invoice.totalCents) {
    return { becamePaid: false };
  }

  const updated = await tx.invoice.updateMany({
    where: { id: invoiceId, tenantId, status: { not: "zaplacena" } },
    data: { status: "zaplacena", paidAt: new Date() },
  });

  return { becamePaid: updated.count > 0 };
}
