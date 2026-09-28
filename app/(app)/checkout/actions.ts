"use server";

import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { checkoutPayloadSchema } from "@/lib/receipts/checkout-schema";
import { createReceiptFromCart } from "@/lib/receipts/create-receipt";

export type CheckoutState = {
  error?: string;
  receiptId?: string;
};

export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  let cartRaw: unknown;
  try {
    cartRaw = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { error: "Neplatný košík." };
  }

  const parsed = checkoutPayloadSchema.safeParse({
    paymentType: formData.get("paymentType"),
    printOnIssue: formData.get("printOnIssue") === "true",
    cart: cartRaw,
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Neplatná data pro vystavení účtenky.",
    };
  }

  try {
    const tenantId = await getTenantId();
    const receiptId = await createReceiptFromCart({
      tenantId,
      paymentType: parsed.data.paymentType,
      printOnIssue: parsed.data.printOnIssue,
      cart: parsed.data.cart,
    });
    return { receiptId };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Účtenku se nepodařilo uložit.",
    };
  }
}
