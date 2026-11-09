import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { buildSpaydForReceipt } from "@/lib/spayd";
import type { TenantSettings } from "@/lib/settings/schema";
import { formatPragueDateCz } from "@/lib/time/prague-parts";
import { RECEIPT_KIND_LABELS, isReceiptKind } from "@/lib/receipts/kind";
import { PAYMENT_TYPE_LABELS, isPaymentType } from "@/lib/receipts/payment-type";
import { registerInvoicePdfFonts } from "@/lib/invoices/pdf/register-fonts";
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
  registerInvoicePdfFonts();

  let qrDataUrl: string | null = null;
  try {
    const spayd = buildSpaydForReceipt({
      bankAccount: settings.bankAccount,
      iban: settings.iban,
      totalCents: receipt.totalCents,
      variableSymbol: receipt.variableSymbol,
      receiptNumber: receipt.number,
    });
    if (spayd) {
      qrDataUrl = await QRCode.toDataURL(spayd, { width: 240, margin: 1 });
    }
  } catch (e) {
    console.error("[renderReceiptPdfBuffer] QR/SPAYD skipped", e);
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

  // Izolace od React dispatcheru server action (jinak digest / Application error).
  const buffer = await new Promise<Uint8Array>((resolve, reject) => {
    setImmediate(() => {
      void renderToBuffer(<ReceiptPdfDocument data={data} />).then(
        resolve,
        reject
      );
    });
  });
  return Buffer.from(buffer);
}
