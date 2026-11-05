"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { formatSmtpError } from "@/lib/mail/send";
import { sendReceiptMail } from "@/lib/mail/send-receipt-mail";

export type ReceiptEmailState = {
  error?: string;
  success?: string;
};

export async function sendReceiptEmailAction(
  _prev: ReceiptEmailState,
  formData: FormData
): Promise<ReceiptEmailState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const receiptId = String(formData.get("receiptId") ?? "");
  const to = String(formData.get("to") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  if (!receiptId) return { error: "Chybí ID účtenky." };
  if (!to) return { error: "Zadejte e-mail." };

  const tenantId = await getTenantId();
  try {
    await sendReceiptMail({
      tenantId,
      receiptId,
      to,
      customerName,
    });
    revalidatePath(`/receipts/${receiptId}`);
    revalidatePath("/receipts");
    return { success: "E-mail s účtenkou odeslán." };
  } catch (e) {
    return { error: formatSmtpError(e) };
  }
}
