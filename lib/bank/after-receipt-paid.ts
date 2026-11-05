import { prisma } from "@/lib/prisma";
import { tryAutoSendReceiptToEet } from "@/lib/eet/submit-receipt";
import { sendVoucherActivationMail } from "@/lib/mail/send-voucher-mail";

/**
 * Kroky mimo DB transakci po zaplacení účtenky: EET (QR), e-mail aktivace poukazu.
 */
export async function afterReceiptPaid(
  tenantId: string,
  receiptId: string,
  voucherActivatedId: string | null
): Promise<void> {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { paymentType: true },
  });
  if (!receipt) return;

  if (receipt.paymentType === "qr") {
    try {
      await tryAutoSendReceiptToEet(tenantId, receiptId);
    } catch (e) {
      console.error("[afterReceiptPaid] EET failed", receiptId, e);
    }
  }

  if (voucherActivatedId) {
    try {
      await sendVoucherActivationMail(tenantId, voucherActivatedId);
    } catch (e) {
      console.error(
        "[afterReceiptPaid] activation mail failed",
        voucherActivatedId,
        e
      );
    }
  }
}
