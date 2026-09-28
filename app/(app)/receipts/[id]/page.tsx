import { notFound } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import { canModifyReceipt } from "@/lib/receipts/eet-status";
import { getTenantSettings } from "@/lib/settings/repository";
import { buildSpaydForReceipt } from "@/lib/spayd";
import { renderReceiptPrintPayload } from "@/lib/receipt-template/render-print";
import { ReceiptDetail } from "@/components/receipts/receipt-detail";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenantId, csrf] = await Promise.all([getTenantId(), getCsrfToken()]);
  const [receipt, settings] = await Promise.all([
    getReceiptForTenant(tenantId, id),
    getTenantSettings(tenantId),
  ]);
  if (!receipt) notFound();

  const qrSpayd =
    receipt.paymentType === "qr"
      ? buildSpaydForReceipt({
          iban: settings.iban,
          totalCents: receipt.totalCents,
          variableSymbol: receipt.variableSymbol,
          receiptNumber: receipt.number,
          companyName: settings.companyName,
        })
      : null;

  const printPayload = renderReceiptPrintPayload(settings, receipt);

  return (
    <ReceiptDetail
      printPayload={printPayload}
      canModify={canModifyReceipt(receipt.eetStatus)}
      csrf={csrf}
      qrSpayd={qrSpayd}
      qrMissingIban={
        receipt.paymentType === "qr" ? !settings.iban?.trim() : undefined
      }
      receipt={{
        id: receipt.id,
        number: receipt.number,
        variableSymbol: receipt.variableSymbol,
        paymentType: receipt.paymentType,
        totalCents: receipt.totalCents,
        eetStatus: receipt.eetStatus,
        eetPok: receipt.eetPok,
        printOnIssue: receipt.printOnIssue,
        createdAt: receipt.createdAt,
        items: receipt.items.map((item) => ({
          id: item.id,
          name: item.name,
          priceCents: item.priceCents,
          quantity: item.quantity,
          category: item.category,
          lineTotalCents: item.lineTotalCents,
        })),
      }}
    />
  );
}
