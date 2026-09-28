"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { submitReceiptToEet } from "@/lib/eet/submit-receipt";
import { createReceiptFromCart } from "@/lib/receipts/create-receipt";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import type { CheckoutCartLine } from "@/lib/receipts/checkout-schema";
import { isPriceCategory } from "@/lib/pricelist/categories";
import { isPaymentType } from "@/lib/receipts/payment-type";
import { prisma } from "@/lib/prisma";

export type ReceiptEetActionState = {
  error?: string;
  success?: string;
  redirectReceiptId?: string;
};

export async function sendReceiptToEetAction(
  _prev: ReceiptEetActionState,
  formData: FormData
): Promise<ReceiptEetActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const receiptId = String(formData.get("receiptId") ?? "");
  const tenantId = await getTenantId();
  const result = await submitReceiptToEet(tenantId, receiptId);
  revalidatePath(`/receipts/${receiptId}`);
  revalidatePath("/receipts");

  if (!result.ok) return { error: result.error };
  return { success: `Odesláno do EET. POK: ${result.pok}` };
}

export async function stornoReceiptInEetAction(
  _prev: ReceiptEetActionState,
  formData: FormData
): Promise<ReceiptEetActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const receiptId = String(formData.get("receiptId") ?? "");
  const tenantId = await getTenantId();
  const result = await submitReceiptToEet(tenantId, receiptId, { storno: true });
  revalidatePath(`/receipts/${receiptId}`);
  revalidatePath("/receipts");

  if (!result.ok) return { error: result.error };
  return { success: "Storno bylo odesláno do EET." };
}

export async function createCorrectionReceiptAction(
  _prev: ReceiptEetActionState,
  formData: FormData
): Promise<ReceiptEetActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const receiptId = String(formData.get("receiptId") ?? "");
  const tenantId = await getTenantId();
  const original = await getReceiptForTenant(tenantId, receiptId);
  if (!original) return { error: "Účtenka nenalezena." };
  if (original.eetStatus !== "stornovano") {
    return {
      error: "Opravnou účtenku lze vystavit až po stornu původní v EET.",
    };
  }

  const cart: CheckoutCartLine[] = [];
  for (const item of original.items) {
    if (!isPriceCategory(item.category)) continue;
    cart.push({
      kind: "custom",
      name: item.name,
      priceCents: item.priceCents,
      quantity: item.quantity,
      category: item.category,
    });
  }
  if (cart.length === 0) {
    return { error: "Účtenka nemá platné položky pro opravu." };
  }

  if (!isPaymentType(original.paymentType)) {
    return { error: "Neplatný typ platby u původní účtenky." };
  }

  const newId = await createReceiptFromCart({
    tenantId,
    paymentType: original.paymentType,
    printOnIssue: false,
    cart,
  });

  await prisma.receipt.update({
    where: { id: newId },
    data: { correctsReceiptId: original.id },
  });

  revalidatePath("/receipts");
  return {
    success: "Opravná účtenka byla vystavena.",
    redirectReceiptId: newId,
  };
}
