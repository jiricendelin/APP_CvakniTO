import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { getTenantSettings } from "@/lib/settings/repository";
import { renderVoucherArtPreviewPdf } from "@/lib/vouchers/pdf/render-voucher-pdf";

export const runtime = "nodejs";

function parseOptionalFloat(raw: FormDataEntryValue | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = parseFloat(String(raw));
  return Number.isFinite(n) ? n : undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    try {
      await assertCsrf(formData);
    } catch {
      return NextResponse.json(
        { error: "Neplatný CSRF token." },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Přihlaste se znovu." },
        { status: 401 }
      );
    }

    const settings = await getTenantSettings(user.tenantId);
    if (!settings.voucherBackImage) {
      return NextResponse.json(
        { error: "Nejdřív nahrajte a uložte zadní stranu." },
        { status: 400 }
      );
    }

    const pdf = await renderVoucherArtPreviewPdf(user.tenantId, settings, {
      voucherNumberX: parseOptionalFloat(formData.get("voucherNumberX")),
      voucherNumberY: parseOptionalFloat(formData.get("voucherNumberY")),
      voucherValidX: parseOptionalFloat(formData.get("voucherValidX")),
      voucherValidY: parseOptionalFloat(formData.get("voucherValidY")),
      voucherNumberFontSize: parseOptionalFloat(
        formData.get("voucherNumberFontSize")
      ),
      voucherValidFontSize: parseOptionalFloat(
        formData.get("voucherValidFontSize")
      ),
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="nahled-zadni-strana.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[POST /api/settings/voucher-art/preview]", e);
    return NextResponse.json(
      {
        error: `Náhled selhal: ${
          e instanceof Error ? e.message : String(e)
        }`,
      },
      { status: 500 }
    );
  }
}
