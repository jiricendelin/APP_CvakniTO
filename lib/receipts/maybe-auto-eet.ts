import { prisma } from "@/lib/prisma";
import { tryAutoSendReceiptToEet } from "@/lib/eet/submit-receipt";
import { canSendReceiptToEet } from "@/lib/receipts/eet-status";

/** Auto EET po změně účtenky / ručním uhrazení — bez duplicitního odeslání. */
export async function maybeAutoEetAfterReceiptChange(
  tenantId: string,
  receiptId: string
): Promise<void> {
  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    select: { eetStatus: true, paidAt: true },
  });
  if (!receipt) return;
  if (!receipt.paidAt) return;
  if (!canSendReceiptToEet(receipt.eetStatus)) return;

  try {
    await tryAutoSendReceiptToEet(tenantId, receiptId);
  } catch (e) {
    console.error("[maybeAutoEetAfterReceiptChange]", receiptId, e);
  }
}
