/**
 * Vytvoření uživatele pro tenant.
 *
 *   npm run create-user -- email@example.com heslo
 *   npm run create-user -- email@example.com heslo CvakniTO
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

function dbHint(url: string | undefined): string {
  if (!url) return "(DATABASE_URL není nastavená)";
  try {
    const u = new URL(url.replace(/^postgresql:/, "http:"));
    return `${u.hostname}:${u.port || "5432"}/${u.pathname.replace(/^\//, "")}`;
  } catch {
    return "(nelze parsovat DATABASE_URL)";
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveTenant(tenantArg?: string) {
  if (tenantArg) {
    if (UUID_RE.test(tenantArg)) {
      const byId = await prisma.tenant.findUnique({ where: { id: tenantArg } });
      if (byId) return byId;
    }
    const byName = await prisma.tenant.findFirst({
      where: { name: tenantArg },
    });
    if (byName) return byName;
    throw new Error(`Tenant nenalezen: ${tenantArg}`);
  }

  const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: "asc" } });
  if (tenants.length === 0) {
    throw new Error("V DB není žádný tenant — nejdřív spusť seed.");
  }
  if (tenants.length > 1) {
    throw new Error(
      "V DB je více tenantů — zadej třetí argument (název nebo UUID tenantu)."
    );
  }
  return tenants[0]!;
}

async function main() {
  const [emailRaw, password, tenantArg] = process.argv.slice(2);
  const email = emailRaw?.toLowerCase().trim();

  if (!email || !password) {
    throw new Error(
      "Použití: npm run create-user -- email@example.com heslo [tenant]"
    );
  }

  console.log(`Cílová DB: ${dbHint(process.env.DATABASE_URL)}`);

  const tenant = await resolveTenant(tenantArg);
  const passwordHash = await hashPassword(password);

  const existing = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      email: { equals: email, mode: "insensitive" },
    },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { email, passwordHash },
      })
    : await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
        },
      });

  console.log(`Uživatel připraven: ${user.email} (tenant ${tenant.name})`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
