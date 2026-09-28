import {
  PAYMENT_TYPE_LABELS,
  isPaymentType,
} from "@/lib/receipts/payment-type";
import type { TenantSettings } from "@/lib/settings/schema";
import { buildSpaydForReceipt } from "@/lib/spayd";
import { formatPragueDateTime } from "@/lib/time/format-prague";
import type { ReceiptTemplateContext } from "./types";

export type ReceiptForTemplate = {
  number: string;
  variableSymbol: string;
  paymentType: string;
  totalCents: number;
  eetStatus: string;
  eetFik?: string | null;
  eetBkp?: string | null;
  createdAt: Date;
  items: {
    name: string;
    quantity: number;
    priceCents: number;
    lineTotalCents: number;
    category: string;
  }[];
};

function eetStatusLabel(status: string): string {
  if (status === "neodeslano") return "Neodesláno do EET";
  return status;
}

export function buildReceiptTemplateContext(
  settings: Pick<
    TenantSettings,
    | "companyName"
    | "companyIco"
    | "companyDic"
    | "companyAddress"
    | "bankAccount"
    | "iban"
  >,
  receipt: ReceiptForTemplate
): ReceiptTemplateContext {
  const paymentLabel = isPaymentType(receipt.paymentType)
    ? PAYMENT_TYPE_LABELS[receipt.paymentType]
    : receipt.paymentType;

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

  return {
    companyName: settings.companyName,
    companyIco: settings.companyIco,
    companyDic: settings.companyDic,
    companyAddress: settings.companyAddress,
    bankAccount: settings.bankAccount,
    iban: settings.iban,
    number: receipt.number,
    variableSymbol: receipt.variableSymbol,
    datetime: formatPragueDateTime(receipt.createdAt),
    paymentLabel,
    paymentType: receipt.paymentType,
    totalCents: receipt.totalCents,
    items: receipt.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      lineTotalCents: item.lineTotalCents,
      category: item.category,
    })),
    qrSpayd,
    eetStatusLabel: eetStatusLabel(receipt.eetStatus),
    eetFik: receipt.eetFik ?? null,
    eetBkp: receipt.eetBkp ?? null,
  };
}
