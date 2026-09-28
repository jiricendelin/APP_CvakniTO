import { prisma } from "@/lib/prisma";

export async function listInvoicesForTenant(tenantId: string) {
  return prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { issuedAt: "desc" },
    include: {
      customer: {
        select: { id: true, name: true },
      },
    },
    take: 200,
  });
}

export async function getInvoiceForTenant(tenantId: string, id: string) {
  return prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      items: { orderBy: { name: "asc" } },
    },
  });
}
