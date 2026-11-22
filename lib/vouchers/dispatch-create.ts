import { getGiftCustomerForTenant } from "@/lib/gift-customers/repository";
import { upsertGiftCustomerFromEmail } from "@/lib/gift-customers/upsert-from-email";
import { prisma } from "@/lib/prisma";
import { createVoucher } from "@/lib/vouchers/create-voucher";
import type { VoucherKind } from "@/lib/vouchers/status";

export type CreateVoucherResult = {
  error?: string;
  success?: string;
  voucherId?: string;
};

function displayName(lastName: string, firstName: string): string {
  return `${lastName} ${firstName}`.trim();
}

function kindFromCategory(category: string): VoucherKind {
  return category === "ostatni" ? "value" : "service";
}

async function resolvePerson(
  tenantId: string,
  prefix: "buyer" | "recipient",
  formData: FormData
): Promise<
  | { error: string }
  | { name: string; email: string; giftCustomerId: string | null }
> {
  const pickedId = String(formData.get(`${prefix}GiftCustomerId`) ?? "").trim();
  if (pickedId) {
    const customer = await getGiftCustomerForTenant(tenantId, pickedId);
    if (!customer) return { error: "Zákazník nenalezen." };
    return {
      name: displayName(customer.lastName, customer.firstName),
      email: customer.email.trim(),
      giftCustomerId: customer.id,
    };
  }

  const lastName = String(formData.get(`${prefix}LastName`) ?? "").trim();
  const firstName = String(formData.get(`${prefix}FirstName`) ?? "").trim();
  const email = String(formData.get(`${prefix}Email`) ?? "").trim();
  const name = displayName(lastName, firstName);

  let giftCustomerId: string | null = null;
  if (email) {
    const { id } = await upsertGiftCustomerFromEmail(tenantId, {
      email,
      firstName,
      lastName,
    });
    giftCustomerId = id;
  }

  return { name, email, giftCustomerId };
}

export async function dispatchCreateVoucher(
  tenantId: string,
  formData: FormData
): Promise<CreateVoucherResult> {
  const buyer = await resolvePerson(tenantId, "buyer", formData);
  if ("error" in buyer) return buyer;
  if (!buyer.name) return { error: "Zadejte jméno kupujícího." };

  const sendEmail = formData.get("sendEmail") === "true";
  if (sendEmail && !buyer.email) {
    return { error: "Pro odeslání e-mailu zadejte e-mail kupujícího." };
  }

  const recipient = await resolvePerson(tenantId, "recipient", formData);
  if ("error" in recipient) return recipient;

  const priceItemId = String(formData.get("priceItemId") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim();

  if (!priceItemId) return { error: "Vyberte položku z ceníku." };
  const item = await prisma.priceItem.findFirst({
    where: {
      id: priceItemId,
      tenantId,
      giftEligible: true,
      active: true,
    },
  });
  if (!item) return { error: "Položka není dostupná jako dárkový poukaz." };

  try {
    const { voucherId } = await createVoucher({
      tenantId,
      kind: kindFromCategory(item.category),
      priceItemId,
      priceCents: item.priceCents,
      buyerName: buyer.name,
      recipientName: recipient.name,
      buyerEmail: buyer.email,
      giftCustomerId: buyer.giftCustomerId,
      note,
    });
    return { success: "Poukaz vystaven.", voucherId };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Poukaz se nepodařilo vytvořit.",
    };
  }
}
