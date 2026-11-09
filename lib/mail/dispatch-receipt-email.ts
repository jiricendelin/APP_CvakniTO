import { z } from "zod";
import { getGiftCustomerForTenant } from "@/lib/gift-customers/repository";
import {
  giftCustomerDisplayName,
  upsertGiftCustomerFromEmail,
} from "@/lib/gift-customers/upsert-from-email";
import { sendReceiptMail } from "@/lib/mail/send-receipt-mail";

export type ReceiptEmailResult = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();

export async function dispatchReceiptEmail(
  tenantId: string,
  receiptId: string,
  formData: FormData
): Promise<ReceiptEmailResult> {
  if (!receiptId) return { error: "Chybí ID účtenky." };

  const giftCustomerIdRaw = String(formData.get("giftCustomerId") ?? "").trim();

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
    if (!customer) return { error: "Zákazník nenalezen." };
    if (!customer.email.trim()) {
      return {
        error: "Zákazník nemá e-mail — doplňte ho v kartotéce.",
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

  if (upsertAfter) {
    try {
      const { created } = await upsertGiftCustomerFromEmail(tenantId, {
        email: to,
        firstName,
        lastName,
      });
      return {
        success: created
          ? "E-mail odeslán. Zákazník založen."
          : "E-mail odeslán. Zákazník doplněn.",
      };
    } catch (e) {
      console.error("[dispatchReceiptEmail] upsert GiftCustomer", e);
      return {
        success: "E-mail odeslán. Zákazníka se nepodařilo uložit.",
      };
    }
  }

  return { success: "E-mail odeslán." };
}
