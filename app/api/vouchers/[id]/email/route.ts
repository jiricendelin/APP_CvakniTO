import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { formatSmtpError } from "@/lib/mail/send";
import { sendVoucherIssueMail } from "@/lib/mail/send-voucher-mail";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    await assertCsrf(formData);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Přihlaste se znovu." },
        { status: 401 }
      );
    }

    const to = String(formData.get("to") ?? "").trim();
    await sendVoucherIssueMail(user.tenantId, id, to || undefined);
    revalidatePath(`/vouchers/${id}`);
    return NextResponse.json({ success: "E-mail s poukazem odeslán." });
  } catch (e) {
    console.error("[POST /api/vouchers/email]", e);
    return NextResponse.json(
      { error: formatSmtpError(e) },
      { status: 500 }
    );
  }
}
