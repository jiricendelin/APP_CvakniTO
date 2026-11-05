import { prisma } from "@/lib/prisma";
import type { BankIngestPayload } from "./ingest-schema";
import { afterReceiptPaid } from "./after-receipt-paid";
import { applyInvoicePayment, applyReceiptPayment } from "./apply-payment";

export type IngestResult =
  | { ok: true; duplicate: true }
  | {
      ok: true;
      duplicate: false;
      matched: boolean;
      paymentId: string;
      receiptId?: string;
      invoiceId?: string;
    };

export async function processBankIngest(
  payload: BankIngestPayload
): Promise<IngestResult> {
  const existing = await prisma.payment.findUnique({
    where: {
      tenantId_moveId: {
        tenantId: payload.tenantId,
        moveId: payload.moveId,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, duplicate: true };
  }

  const vs = payload.variableSymbol.replace(/\D/g, "");
  if (!vs) {
    throw new Error("Neplatný variabilní symbol.");
  }

  const bookedAt = payload.bookedAt ? new Date(payload.bookedAt) : null;

  const invoice = await prisma.invoice.findFirst({
    where: { tenantId: payload.tenantId, variableSymbol: vs },
    select: { id: true },
  });

  const receipt =
    invoice === null
      ? await prisma.receipt.findFirst({
          where: { tenantId: payload.tenantId, variableSymbol: vs },
          select: { id: true },
        })
      : null;

  const matched = Boolean(invoice || receipt);

  let becamePaid = false;
  let voucherActivatedId: string | null = null;

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        tenantId: payload.tenantId,
        moveId: payload.moveId,
        variableSymbol: vs,
        amountCents: payload.amountCents,
        bookedAt,
        message: payload.message ?? "",
        receiptId: receipt?.id ?? null,
        invoiceId: invoice?.id ?? null,
        matched,
      },
      select: { id: true },
    });

    if (receipt) {
      const result = await applyReceiptPayment(
        tx,
        payload.tenantId,
        receipt.id
      );
      becamePaid = result.becamePaid;
      voucherActivatedId = result.voucherActivatedId;
    } else if (invoice) {
      await applyInvoicePayment(tx, payload.tenantId, invoice.id);
    }

    return created;
  });

  if (receipt && becamePaid) {
    await afterReceiptPaid(
      payload.tenantId,
      receipt.id,
      voucherActivatedId
    );
  }

  return {
    ok: true,
    duplicate: false,
    matched,
    paymentId: payment.id,
    receiptId: receipt?.id,
    invoiceId: invoice?.id,
  };
}
