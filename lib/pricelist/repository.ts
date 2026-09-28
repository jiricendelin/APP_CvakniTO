import { prisma } from "@/lib/prisma";
import { DEFAULT_PRICE_ITEMS } from "./defaults";

export async function listPriceItems(tenantId: string) {
  return prisma.priceItem.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Aktivní položky pro pokladnu (R10). */
export async function listActivePriceItems(tenantId: string) {
  return prisma.priceItem.findMany({
    where: { tenantId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function seedDefaultPriceItemsIfEmpty(tenantId: string) {
  const count = await prisma.priceItem.count({ where: { tenantId } });
  if (count > 0) return 0;

  await prisma.priceItem.createMany({
    data: DEFAULT_PRICE_ITEMS.map((item) => ({
      tenantId,
      name: item.name,
      priceCents: item.priceCents,
      category: item.category,
      sortOrder: item.sortOrder,
      active: true,
    })),
  });
  return DEFAULT_PRICE_ITEMS.length;
}
