import { prisma } from "@/lib/prisma";
import { sendReceiptMail } from "@/lib/mail/send-receipt-mail";
import { notifyReminderHook } from "@/lib/cron/notify-hook";
import { tryAutoSendReceiptToEet } from "@/lib/eet/submit-receipt";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export type DailyCronResult = {
  expiredVouchers: number;
  remindersSent: number;
  reminderErrors: number;
  eetRetried: number;
  eetErrors: number;
};

export async function runDailyCron(now = new Date()): Promise<DailyCronResult> {
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const expired = await prisma.voucher.updateMany({
    where: {
      status: { in: ["vystaveny", "zaplaceny"] },
      validUntil: { lt: todayUtc },
    },
    data: { status: "propadly" },
  });

  const cutoff = new Date(now.getTime() - THREE_DAYS_MS);
  const unpaid = await prisma.receipt.findMany({
    where: {
      kind: "poukaz",
      remindersEnabled: true,
      paidAt: null,
      reminderSentAt: null,
      paymentType: "qr",
      createdAt: { lte: cutoff },
      stornedAt: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      voucher: { select: { buyerEmail: true, buyerName: true } },
      giftCustomer: { select: { email: true, firstName: true, lastName: true } },
    },
    take: 200,
  });

  let remindersSent = 0;
  let reminderErrors = 0;

  for (const receipt of unpaid) {
    const to =
      receipt.voucher?.buyerEmail?.trim() ||
      receipt.giftCustomer?.email?.trim() ||
      "";
    if (!to) continue;

    const customerName =
      receipt.voucher?.buyerName ||
      (receipt.giftCustomer
        ? `${receipt.giftCustomer.firstName} ${receipt.giftCustomer.lastName}`.trim()
        : "");

    try {
      await sendReceiptMail({
        tenantId: receipt.tenantId,
        receiptId: receipt.id,
        to,
        customerName,
        reminder: true,
      });
      remindersSent += 1;
      await notifyReminderHook({
        tenantId: receipt.tenantId,
        receiptId: receipt.id,
        receiptNumber: receipt.number,
        to,
        totalCents: receipt.totalCents,
      });
    } catch (e) {
      reminderErrors += 1;
      console.error("[cron] reminder failed", receipt.id, e);
    }
  }

  const eetCandidates = await prisma.receipt.findMany({
    where: {
      paidAt: { not: null },
      paymentType: "qr",
      stornedAt: null,
      eetStatus: { in: ["neodeslano", "chyba"] },
    },
    select: { id: true, tenantId: true },
    take: 50,
  });

  let eetRetried = 0;
  let eetErrors = 0;

  for (const receipt of eetCandidates) {
    try {
      const result = await tryAutoSendReceiptToEet(
        receipt.tenantId,
        receipt.id
      );
      if (!result) continue;
      eetRetried += 1;
      if (!result.ok) eetErrors += 1;
    } catch (e) {
      eetErrors += 1;
      console.error("[cron] EET retry failed", receipt.id, e);
    }
  }

  return {
    expiredVouchers: expired.count,
    remindersSent,
    reminderErrors,
    eetRetried,
    eetErrors,
  };
}
