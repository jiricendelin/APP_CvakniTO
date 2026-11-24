import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth";
import { getInvoiceForTenant } from "@/lib/invoices/repository";
import { invoicePdfFilename } from "@/lib/invoices/pdf/filename";
import { renderInvoicePdfBuffer } from "@/lib/invoices/pdf/render-invoice-pdf";
import { getTenantSettings } from "@/lib/settings/repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantId();
    const [invoice, settings] = await Promise.all([
      getInvoiceForTenant(tenantId, id),
      getTenantSettings(tenantId),
    ]);
    if (!invoice) {
      return NextResponse.json({ error: "Faktura nenalezena." }, { status: 404 });
    }
    if (invoice.status === "koncept") {
      return NextResponse.json(
        { error: "Fakturu nejdřív vystavte." },
        { status: 400 }
      );
    }

    const pdf = await renderInvoicePdfBuffer(invoice, settings);
    const filename = invoicePdfFilename(invoice.number, invoice.customer.name);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "PDF se nepodařilo vygenerovat." },
      { status: 500 }
    );
  }
}
