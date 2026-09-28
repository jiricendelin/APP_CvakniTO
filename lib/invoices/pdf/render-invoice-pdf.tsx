import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { buildSpaydForReceipt } from "@/lib/spayd";
import type { TenantSettings } from "@/lib/settings/schema";
import type { getInvoiceForTenant } from "@/lib/invoices/repository";
import { InvoicePdfDocument, type InvoicePdfData } from "./invoice-pdf-document";
import { registerInvoicePdfFonts } from "./register-fonts";

type InvoiceWithRelations = NonNullable<
  Awaited<ReturnType<typeof getInvoiceForTenant>>
>;

export async function renderInvoicePdfBuffer(
  invoice: InvoiceWithRelations,
  settings: TenantSettings
): Promise<Buffer> {
  registerInvoicePdfFonts();

  const spayd = buildSpaydForReceipt({
    iban: settings.iban,
    totalCents: invoice.totalCents,
    variableSymbol: invoice.variableSymbol,
    receiptNumber: invoice.number,
    companyName: settings.companyName,
  });

  let qrDataUrl: string | null = null;
  if (spayd) {
    qrDataUrl = await QRCode.toDataURL(spayd, {
      width: 240,
      margin: 1,
    });
  }

  const data: InvoicePdfData = {
    number: invoice.number,
    variableSymbol: invoice.variableSymbol,
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueDate,
    totalCents: invoice.totalCents,
    items: invoice.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      priceCents: item.priceCents,
      lineTotalCents: item.lineTotalCents,
      category: item.category,
    })),
    customer: invoice.customer,
    settings,
    qrDataUrl,
  };

  const buffer = await renderToBuffer(<InvoicePdfDocument data={data} />);
  return Buffer.from(buffer);
}
