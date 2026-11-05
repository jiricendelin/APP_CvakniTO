import { prisma } from "@/lib/prisma";

export async function listGiftCustomersForTenant(tenantId: string) {
  return prisma.giftCustomer.findMany({
    where: { tenantId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getGiftCustomerForTenant(tenantId: string, id: string) {
  return prisma.giftCustomer.findFirst({
    where: { id, tenantId },
  });
}
