import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { formatSmtpError } from "@/lib/mail/send";
import { sendVoucherIssueMail } from "@/lib/mail/send-voucher-mail";
import { dispatchCreateVoucher } from "@/lib/vouchers/dispatch-create";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    await assertCsrf(formData);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Přihlaste se znovu." },
        { status: 401 }
      );
    }

    const result = await dispatchCreateVoucher(user.tenantId, formData);
    if (result.error || !result.voucherId) {
      return NextResponse.json(result, { status: 400 });
    }

    const sendEmail = formData.get("sendEmail") === "true";
    if (sendEmail) {
      try {
        await sendVoucherIssueMail(user.tenantId, result.voucherId);
      } catch (e) {
        revalidatePath("/vouchers");
        revalidatePath("/receipts");
        revalidatePath("/gift-customers");
        return NextResponse.json({
          voucherId: result.voucherId,
          success: "Poukaz vytvořen, ale e-mail se nepodařilo odeslat.",
          error: formatSmtpError(e),
        });
      }
    }

    revalidatePath("/vouchers");
    revalidatePath("/receipts");
    revalidatePath("/gift-customers");
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/vouchers]", e);
    return NextResponse.json(
      { error: formatSmtpError(e) },
      { status: 500 }
    );
  }
}
