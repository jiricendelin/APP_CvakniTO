import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TENANT_NAME = "CvakniTO";

async function main() {
  const existing = await prisma.tenant.findFirst({
    where: { name: DEFAULT_TENANT_NAME },
  });

  if (existing) {
    console.log(`Seed: tenant already exists (${existing.id})`);
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: DEFAULT_TENANT_NAME },
  });

  console.log(`Seed: created tenant ${tenant.id} (${tenant.name})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
