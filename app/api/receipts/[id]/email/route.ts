import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { dispatchReceiptEmail } from "@/lib/mail/dispatch-receipt-email";
import { formatSmtpError } from "@/lib/mail/send";

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
    const result = await dispatchReceiptEmail(user.tenantId, id, formData);

    if (result.success) {
      revalidatePath(`/receipts/${id}`);
      revalidatePath("/receipts");
      revalidatePath("/gift-customers");
    }

    const status = result.error && !result.success ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (e) {
    console.error("[POST /api/receipts/email]", e);
    return NextResponse.json(
      { error: formatSmtpError(e) },
      { status: 500 }
    );
  }
}
