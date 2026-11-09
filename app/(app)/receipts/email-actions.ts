"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { getGiftCustomerForTenant } from "@/lib/gift-customers/repository";
import {
  giftCustomerDisplayName,
  upsertGiftCustomerFromEmail,
} from "@/lib/gift-customers/upsert-from-email";
import { formatSmtpError } from "@/lib/mail/send";
import { sendReceiptMail } from "@/lib/mail/send-receipt-mail";

export type ReceiptEmailState = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();

export async function sendReceiptEmailAction(
  _prev: ReceiptEmailState,
  formData: FormData
): Promise<ReceiptEmailState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  try {
    const receiptId = String(formData.get("receiptId") ?? "");
    const giftCustomerIdRaw = String(formData.get("giftCustomerId") ?? "").trim();
    if (!receiptId) return { error: "Chybí ID účtenky." };

    const tenantId = await getTenantId();

    let to: string;
    let customerName: string;
    let upsertAfter = false;
    let firstName = "";
    let lastName = "";

    if (giftCustomerIdRaw && uuidSchema.safeParse(giftCustomerIdRaw).success) {
      const customer = await getGiftCustomerForTenant(
        tenantId,
        giftCustomerIdRaw
      );
      if (!customer) return { error: "Zákazník DP nenalezen." };
      if (!customer.email.trim()) {
        return {
          error: "Zákazník DP nemá e-mail — doplňte ho v Zákaznících DP.",
        };
      }
      to = customer.email.trim();
      customerName = giftCustomerDisplayName(customer);
    } else {
      to = String(formData.get("to") ?? "").trim();
      firstName = String(formData.get("firstName") ?? "").trim();
      lastName = String(formData.get("lastName") ?? "").trim();
      if (!to) return { error: "Zadejte e-mail." };
      customerName = giftCustomerDisplayName({ firstName, lastName });
      upsertAfter = true;
    }

    await sendReceiptMail({
      tenantId,
      receiptId,
      to,
      customerName: customerName || undefined,
    });

    revalidatePath(`/receipts/${receiptId}`);
    revalidatePath("/receipts");

    if (upsertAfter) {
      try {
        const { created } = await upsertGiftCustomerFromEmail(tenantId, {
          email: to,
          firstName,
          lastName,
        });
        revalidatePath("/gift-customers");
        return {
          success: created
            ? "E-mail odeslán. Zákazník DP založen."
            : "E-mail odeslán. Zákazník DP doplněn.",
        };
      } catch (e) {
        console.error("[sendReceiptEmailAction] upsert GiftCustomer", e);
        return {
          success: "E-mail odeslán. Zákazníka DP se nepodařilo uložit.",
        };
      }
    }

    return { success: "E-mail odeslán zákazníkovi DP." };
  } catch (e) {
    unstable_rethrow(e);
    console.error("[sendReceiptEmailAction]", e);
    return { error: formatSmtpError(e) };
  }
}
