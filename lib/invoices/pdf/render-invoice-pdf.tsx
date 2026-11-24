import fs from "node:fs/promises";
import path from "node:path";
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

async function loadLogoDataUrl(): Promise<string | null> {
  const logoPath = path.join(
    process.cwd(),
    "lib/invoices/assets/Timmy_logo_RGB.png"
  );
  try {
    const logoBuffer = await fs.readFile(logoPath);
    return `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderInvoicePdfBuffer(
  invoice: InvoiceWithRelations,
  settings: TenantSettings
): Promise<Buffer> {
  registerInvoicePdfFonts();

  const spayd = buildSpaydForReceipt({
    bankAccount: settings.bankAccount,
    iban: settings.iban,
    totalCents: invoice.totalCents,
    variableSymbol: invoice.variableSymbol,
    receiptNumber: invoice.number,
  });

  let qrDataUrl: string | null = null;
  if (spayd) {
    qrDataUrl = await QRCode.toDataURL(spayd, {
      width: 240,
      margin: 1,
    });
  }

  const logoSrc = await loadLogoDataUrl();

  const data: InvoicePdfData = {
    number: invoice.number,
    variableSymbol: invoice.variableSymbol,
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueDate,
    totalCents: invoice.totalCents,
    items: invoice.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    customer: {
      name: invoice.customer.name,
      ico: invoice.customer.ico,
      dic: invoice.customer.dic,
      address: invoice.customer.address,
    },
    settings: {
      companyName: settings.companyName,
      companyIco: settings.companyIco,
      companyAddress: settings.companyAddress,
      companyEmail: settings.companyEmail,
      companyPhone: settings.companyPhone,
      companySignature: settings.companySignature,
      bankAccount: settings.bankAccount,
      iban: settings.iban,
      swift: settings.swift,
    },
    qrDataUrl,
    logoSrc,
  };

  const buffer = await renderToBuffer(<InvoicePdfDocument data={data} />);
  return Buffer.from(buffer);
}
