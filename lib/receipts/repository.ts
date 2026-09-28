import { prisma } from "@/lib/prisma";

export async function getReceiptForTenant(tenantId: string, id: string) {
  return prisma.receipt.findFirst({
    where: { id, tenantId },
    include: {
      items: { orderBy: { name: "asc" } },
    },
  });
}
