import { formatCzk } from "@/lib/money";
import type { TenantSettings } from "@/lib/settings/schema";
import { formatPragueDateCz } from "@/lib/time/prague-parts";

export function buildVoucherMailContext(input: {
  settings: TenantSettings;
  voucherNumber: string;
  recipientName: string;
  buyerName: string;
  validUntil: Date;
  totalCents: number;
  variableSymbol: string;
  receiptNumber: string;
  serviceName: string;
}) {
  return {
    companyName: input.settings.companyName || "CvakniTO",
    voucherNumber: input.voucherNumber,
    recipientName: input.recipientName,
    buyerName: input.buyerName,
    validUntil: formatPragueDateCz(input.validUntil),
    totalCzk: formatCzk(input.totalCents),
    variableSymbol: input.variableSymbol,
    receiptNumber: input.receiptNumber,
    serviceName: input.serviceName,
    customerName: input.buyerName,
  };
}
