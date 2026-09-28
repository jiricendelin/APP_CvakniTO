import { PrismaClient } from "@prisma/client";
import { DEFAULT_PRICE_ITEMS } from "../lib/pricelist/defaults";

const prisma = new PrismaClient();

const DEFAULT_TENANT_NAME = "CvakniTO";

async function seedPriceItemsForTenant(tenantId: string) {
  const count = await prisma.priceItem.count({ where: { tenantId } });
  if (count > 0) {
    console.log(`Seed: price items already exist (${count})`);
    return;
  }

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
  console.log(`Seed: created ${DEFAULT_PRICE_ITEMS.length} price items`);
}

async function main() {
  let tenant = await prisma.tenant.findFirst({
    where: { name: DEFAULT_TENANT_NAME },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: DEFAULT_TENANT_NAME },
    });
    console.log(`Seed: created tenant ${tenant.id} (${tenant.name})`);
  } else {
    console.log(`Seed: tenant already exists (${tenant.id})`);
  }

  await seedPriceItemsForTenant(tenant.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
