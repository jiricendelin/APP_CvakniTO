import { getGiftCustomerForTenant } from "@/lib/gift-customers/repository";

export async function resolveRecipientName(
  tenantId: string,
  recipientName: string,
  recipientGiftCustomerId: string | null
): Promise<string> {
  const manual = recipientName.trim();
  if (manual) return manual;

  if (!recipientGiftCustomerId) return "";

  const customer = await getGiftCustomerForTenant(
    tenantId,
    recipientGiftCustomerId
  );
  if (!customer) return "";

  return `${customer.lastName} ${customer.firstName}`.trim();
}
