import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import { renderReceiptPdfBuffer } from "@/lib/receipts/pdf/render-receipt-pdf";
import { getTenantSettings } from "@/lib/settings/repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tenantId = await getTenantId();
    const [receipt, settings] = await Promise.all([
      getReceiptForTenant(tenantId, id),
      getTenantSettings(tenantId),
    ]);
    if (!receipt) {
      return NextResponse.json({ error: "Účtenka nenalezena." }, { status: 404 });
    }

    const pdf = await renderReceiptPdfBuffer(receipt, settings);
    const safeName = receipt.number.replace(/[^\w.-]+/g, "_");

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="uctenka-${safeName}.pdf"`,
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
