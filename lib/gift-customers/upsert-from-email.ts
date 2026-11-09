import { prisma } from "@/lib/prisma";

/**
 * Po ručním odeslání účtenky — založit nebo doplnit zákazníka DP podle e-mailu.
 */
export async function upsertGiftCustomerFromEmail(
  tenantId: string,
  input: { email: string; firstName: string; lastName: string }
): Promise<{ created: boolean; id: string }> {
  const email = input.email.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  const existing = await prisma.giftCustomer.findFirst({
    where: { tenantId, email: { equals: email, mode: "insensitive" } },
  });

  if (existing) {
    const updates: { firstName?: string; lastName?: string } = {};
    if (!existing.firstName.trim() && firstName) updates.firstName = firstName;
    if (!existing.lastName.trim() && lastName) updates.lastName = lastName;
    if (Object.keys(updates).length > 0) {
      await prisma.giftCustomer.update({
        where: { id: existing.id },
        data: updates,
      });
    }
    return { created: false, id: existing.id };
  }

  const created = await prisma.giftCustomer.create({
    data: {
      tenantId,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
    },
    select: { id: true },
  });

  return { created: true, id: created.id };
}

export function giftCustomerDisplayName(c: {
  firstName: string;
  lastName: string;
}): string {
  return `${c.firstName} ${c.lastName}`.trim() || "Zákazník";
}
