import { notFound } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import {
  canDeleteReceipt,
  canModifyReceipt,
} from "@/lib/receipts/eet-status";
import { listGiftCustomersForTenant } from "@/lib/gift-customers/repository";
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
  const [receipt, settings, giftCustomers] = await Promise.all([
    getReceiptForTenant(tenantId, id),
    getTenantSettings(tenantId),
    listGiftCustomersForTenant(tenantId),
  ]);
  if (!receipt) notFound();

  const qrSpayd =
    receipt.paymentType === "qr"
      ? buildSpaydForReceipt({
          bankAccount: settings.bankAccount,
          iban: settings.iban,
          totalCents: receipt.totalCents,
          variableSymbol: receipt.variableSymbol,
          receiptNumber: receipt.number,
        })
      : null;

  const printPayload = renderReceiptPrintPayload(settings, receipt);

  return (
    <ReceiptDetail
      printPayload={printPayload}
      showPdfDownload={settings.receiptPdfDownload}
      canModify={canModifyReceipt({
        eetStatus: receipt.eetStatus,
        paidAt: receipt.paidAt,
        kind: receipt.kind,
      })}
      canDelete={canDeleteReceipt({
        eetStatus: receipt.eetStatus,
        paidAt: receipt.paidAt,
        kind: receipt.kind,
      })}
      giftCustomers={giftCustomers.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
      }))}
      csrf={csrf}
      qrSpayd={qrSpayd}
      qrMissingIban={
        receipt.paymentType === "qr" ? !qrSpayd : undefined
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
        paidAt: receipt.paidAt,
        createdAt: receipt.createdAt,
        kind: receipt.kind,
        remindersEnabled: receipt.remindersEnabled,
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
