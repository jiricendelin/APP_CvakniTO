import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { saveVoucherArtFromForm } from "@/lib/vouchers/save-voucher-art-from-form";

export const runtime = "nodejs";

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

    const result = await saveVoucherArtFromForm(user.tenantId, formData);
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    revalidatePath("/settings");
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/settings/voucher-art]", e);
    return NextResponse.json(
      {
        error: `Uložení selhalo: ${
          e instanceof Error ? e.message : String(e)
        }`,
      },
      { status: 500 }
    );
  }
}
