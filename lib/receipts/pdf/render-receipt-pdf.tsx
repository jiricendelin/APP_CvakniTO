import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { buildSpaydForReceipt } from "@/lib/spayd";
import type { TenantSettings } from "@/lib/settings/schema";
import { formatPragueDateCz } from "@/lib/time/prague-parts";
import { RECEIPT_KIND_LABELS, isReceiptKind } from "@/lib/receipts/kind";
import { PAYMENT_TYPE_LABELS, isPaymentType } from "@/lib/receipts/payment-type";
import { ReceiptPdfDocument, type ReceiptPdfData } from "./receipt-pdf-document";

export type ReceiptPdfSource = {
  number: string;
  variableSymbol: string;
  totalCents: number;
  paymentType: string;
  kind: string;
  createdAt: Date;
  items: { name: string; quantity: number; lineTotalCents: number }[];
};

export async function renderReceiptPdfBuffer(
  receipt: ReceiptPdfSource,
  settings: TenantSettings
): Promise<Buffer> {
  const spayd = buildSpaydForReceipt({
    bankAccount: settings.bankAccount,
    iban: settings.iban,
    totalCents: receipt.totalCents,
    variableSymbol: receipt.variableSymbol,
    receiptNumber: receipt.number,
  });

  let qrDataUrl: string | null = null;
  if (spayd) {
    qrDataUrl = await QRCode.toDataURL(spayd, { width: 240, margin: 1 });
  }

  const data: ReceiptPdfData = {
    companyName: settings.companyName || "CvakniTO",
    companyIco: settings.companyIco || "",
    companyAddress: settings.companyAddress || "",
    number: receipt.number,
    variableSymbol: receipt.variableSymbol,
    totalCents: receipt.totalCents,
    paymentTypeLabel: isPaymentType(receipt.paymentType)
      ? PAYMENT_TYPE_LABELS[receipt.paymentType]
      : receipt.paymentType,
    issuedAtLabel: formatPragueDateCz(receipt.createdAt),
    items: receipt.items,
    qrDataUrl,
    kindLabel: isReceiptKind(receipt.kind)
      ? RECEIPT_KIND_LABELS[receipt.kind]
      : receipt.kind,
  };

  const buffer = await renderToBuffer(<ReceiptPdfDocument data={data} />);
  return Buffer.from(buffer);
}
