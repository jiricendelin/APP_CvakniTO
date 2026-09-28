import { formatCzk } from "@/lib/money";
import type { MailTemplateContext } from "@/lib/mail/render-template";
import { formatPragueDate } from "@/lib/time/format-prague";
import type { TenantSettings } from "@/lib/settings/schema";

export function buildInvoiceMailContext(input: {
  settings: Pick<TenantSettings, "companyName">;
  invoice: {
    number: string;
    variableSymbol: string;
    totalCents: number;
    dueDate: Date;
  };
  customer: { name: string };
}): MailTemplateContext {
  return {
    companyName: input.settings.companyName || "Dodavatel",
    customerName: input.customer.name,
    invoiceNumber: input.invoice.number,
    variableSymbol: input.invoice.variableSymbol,
    totalCzk: formatCzk(input.invoice.totalCents),
    dueDate: formatPragueDate(input.invoice.dueDate),
  };
}
