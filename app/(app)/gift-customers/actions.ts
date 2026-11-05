"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { parseCzkInput } from "@/lib/money";
import { createStornoReceipt } from "@/lib/receipts/create-storno-receipt";
import { formatSmtpError } from "@/lib/mail/send";
import { sendReceiptMail } from "@/lib/mail/send-receipt-mail";

export type GiftCustomerActionState = {
  error?: string;
  success?: string;
  receiptId?: string;
};

const fieldsSchema = z.object({
  lastName: z.string().trim().min(1, "Zadejte příjmení.").max(100),
  firstName: z.string().trim().min(1, "Zadejte jméno.").max(100),
  phone: z.string().max(40).optional().default(""),
  email: z.string().max(200).optional().default(""),
  note: z.string().max(2000).optional().default(""),
  awaitingStornoPayment: z.boolean().optional().default(false),
  stornoFeeCents: z.number().int().min(0).optional().default(0),
});

function trimFields(data: z.infer<typeof fieldsSchema>) {
  return {
    lastName: data.lastName.trim(),
    firstName: data.firstName.trim(),
    phone: data.phone?.trim() ?? "",
    email: data.email?.trim() ?? "",
    note: data.note?.trim() ?? "",
    awaitingStornoPayment: data.awaitingStornoPayment ?? false,
    stornoFeeCents: data.stornoFeeCents ?? 0,
  };
}

async function assertOwned(tenantId: string, id: string) {
  const row = await prisma.giftCustomer.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!row) throw new Error("Zákazník DP nenalezen.");
}

export async function createGiftCustomerAction(
  _prev: GiftCustomerActionState,
  formData: FormData
): Promise<GiftCustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const feeRaw = String(formData.get("stornoFee") ?? "").trim();
  const feeCents = feeRaw ? parseCzkInput(feeRaw) : 0;
  if (feeCents === null) return { error: "Neplatná výše stornopoplatku." };

  const parsed = fieldsSchema.safeParse({
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    note: formData.get("note"),
    awaitingStornoPayment: formData.get("awaitingStornoPayment") === "true",
    stornoFeeCents: feeCents,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const tenantId = await getTenantId();
  await prisma.giftCustomer.create({
    data: { tenantId, ...trimFields(parsed.data) },
  });

  revalidatePath("/gift-customers");
  return { success: "Zákazník DP vytvořen." };
}

export async function updateGiftCustomerAction(
  _prev: GiftCustomerActionState,
  formData: FormData
): Promise<GiftCustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID." };

  const feeRaw = String(formData.get("stornoFee") ?? "").trim();
  const feeCents = feeRaw ? parseCzkInput(feeRaw) : 0;
  if (feeCents === null) return { error: "Neplatná výše stornopoplatku." };

  const parsed = fieldsSchema.safeParse({
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    note: formData.get("note"),
    awaitingStornoPayment: formData.get("awaitingStornoPayment") === "true",
    stornoFeeCents: feeCents,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const tenantId = await getTenantId();
  try {
    await assertOwned(tenantId, id);
  } catch {
    return { error: "Zákazník DP nenalezen." };
  }

  await prisma.giftCustomer.update({
    where: { id },
    data: trimFields(parsed.data),
  });

  revalidatePath("/gift-customers");
  return { success: "Uloženo." };
}

export async function deleteGiftCustomerAction(
  _prev: GiftCustomerActionState,
  formData: FormData
): Promise<GiftCustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID." };

  const tenantId = await getTenantId();
  try {
    await assertOwned(tenantId, id);
  } catch {
    return { error: "Zákazník DP nenalezen." };
  }

  await prisma.giftCustomer.delete({ where: { id } });
  revalidatePath("/gift-customers");
  return { success: "Smazáno." };
}

export async function createStornoReceiptAction(
  _prev: GiftCustomerActionState,
  formData: FormData
): Promise<GiftCustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const giftCustomerId = String(formData.get("giftCustomerId") ?? "");
  if (!giftCustomerId) return { error: "Chybí zákazník." };

  const amount = parseCzkInput(String(formData.get("amount") ?? ""));
  if (amount === null || amount <= 0) {
    return { error: "Zadejte částku stornopoplatku." };
  }

  const sendEmail = formData.get("sendEmail") === "true";
  const tenantId = await getTenantId();

  try {
    const receiptId = await createStornoReceipt({
      tenantId,
      giftCustomerId,
      amountCents: amount,
      description: String(formData.get("description") ?? "").trim() || undefined,
    });

    if (sendEmail) {
      const customer = await prisma.giftCustomer.findFirst({
        where: { id: giftCustomerId, tenantId },
      });
      if (customer?.email) {
        try {
          await sendReceiptMail({
            tenantId,
            receiptId,
            to: customer.email,
            customerName: `${customer.firstName} ${customer.lastName}`.trim(),
          });
        } catch (e) {
          revalidatePath("/gift-customers");
          revalidatePath("/receipts");
          return {
            receiptId,
            success: "Účtenka vytvořena, e-mail selhal.",
            error: formatSmtpError(e),
          };
        }
      }
    }

    revalidatePath("/gift-customers");
    revalidatePath("/receipts");
    return { success: "Storno účtenka vystavena.", receiptId };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Účtenku se nepodařilo vytvořit.",
    };
  }
}
