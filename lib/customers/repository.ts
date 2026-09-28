import { prisma } from "@/lib/prisma";

export async function listCustomersForTenant(tenantId: string) {
  return prisma.customer.findMany({
    where: { tenantId },
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
  });
}

export async function getCustomerForTenant(tenantId: string, id: string) {
  return prisma.customer.findFirst({
    where: { id, tenantId },
  });
}
