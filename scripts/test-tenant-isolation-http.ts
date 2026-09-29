/**
 * R25 (plné kritérium): HTTP-level test izolace tenantů.
 *
 * Na rozdíl od `test-tenant-isolation.ts` (repository vrstva) tento test
 * vytvoří dva reálné tenanty s uživateli a daty, přihlásí se jako uživatel B
 * přes skutečnou session a přes `fetch` zkusí sáhnout na data tenanta A
 * přímo přes URL/ID — u stránek (/receipts/:id, /receipts/:id/edit,
 * /invoices/:id), API (/api/invoices/:id/pdf) a /settings.
 *
 * Vyžaduje běžící aplikaci se stejnou DATABASE_URL a SESSION_SECRET:
 *
 *   npm run dev
 *   BASE_URL=http://localhost:3000 npm run test:tenant-isolation-http
 *
 * Testovací tenanty/uživatele/data se po testu vždy smažou (i při chybě).
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { signSession } from "../lib/auth/session";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SESSION_COOKIE = "cvaknito_session";
const suffix = Date.now().toString(36);

function readSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Chybí SESSION_SECRET v prostředí skriptu — musí být stejný jako u běžícího serveru."
    );
  }
  return secret;
}

async function ensureServerRunning(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch (e) {
    throw new Error(
      `Aplikace neběží na ${BASE_URL} (spusť "npm run dev" v jiném terminálu se stejnou DATABASE_URL/SESSION_SECRET). Detail: ${
        e instanceof Error ? e.message : String(e)
      }`
    );
  }
}

async function createFixtureTenant(label: "A" | "B") {
  const tenant = await prisma.tenant.create({
    data: { name: `TestIzolace-${label}-${suffix}` },
  });
  const passwordHash = await hashPassword("Test1234!");
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `test-izolace-${label.toLowerCase()}-${suffix}@example.invalid`,
      passwordHash,
    },
  });
  await prisma.setting.create({
    data: {
      tenantId: tenant.id,
      data: { companyName: `Firma-${label}-${suffix}` },
    },
  });
  return { tenant, user };
}

async function createTenantAData(tenantId: string) {
  const receipt = await prisma.receipt.create({
    data: {
      tenantId,
      number: `TEST-${suffix}-1`,
      variableSymbol: `${suffix}1`,
      paymentType: "hotove",
      totalCents: 10000,
      items: {
        create: [
          {
            tenantId,
            name: "Test položka",
            priceCents: 10000,
            quantity: 1,
            category: "ostatni",
            lineTotalCents: 10000,
          },
        ],
      },
    },
  });

  const customer = await prisma.customer.create({
    data: { tenantId, name: `Test zákazník ${suffix}` },
  });

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      customerId: customer.id,
      number: `TESTF-${suffix}-1`,
      variableSymbol: `${suffix}2`,
      totalCents: 10000,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            tenantId,
            name: "Test položka",
            priceCents: 10000,
            quantity: 1,
            category: "ostatni",
            lineTotalCents: 10000,
          },
        ],
      },
    },
  });

  return { receipt, invoice };
}

async function fetchAs(token: string, path: string): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    headers: { Cookie: `${SESSION_COOKIE}=${token}` },
    redirect: "manual",
  });
}

async function main() {
  await ensureServerRunning();
  const secret = readSessionSecret();

  const [a, b] = await Promise.all([
    createFixtureTenant("A"),
    createFixtureTenant("B"),
  ]);

  try {
    const data = await createTenantAData(a.tenant.id);
    const tokenA = await signSession(a.user.id, secret);
    const tokenB = await signSession(b.user.id, secret);

    // Sanity: majitel (A) se ke své účtence dostane — jinak by dál test nic neříkal.
    const ownReceipt = await fetchAs(tokenA, `/receipts/${data.receipt.id}`);
    if (ownReceipt.status !== 200) {
      throw new Error(
        `Sanity FAIL: vlastník (tenant A) nevidí svou účtenku (status ${ownReceipt.status})`
      );
    }

    // Útok: uživatel B zkouší přímé URL/ID na data tenanta A.
    const checks: Array<{ label: string; path: string }> = [
      { label: "účtenka (detail)", path: `/receipts/${data.receipt.id}` },
      { label: "účtenka (editace)", path: `/receipts/${data.receipt.id}/edit` },
      { label: "faktura (detail)", path: `/invoices/${data.invoice.id}` },
      { label: "faktura (PDF API)", path: `/api/invoices/${data.invoice.id}/pdf` },
    ];

    for (const check of checks) {
      const res = await fetchAs(tokenB, check.path);
      if (res.status !== 404) {
        throw new Error(
          `Únik: uživatel B dostal status ${res.status} (čekáno 404) na ${check.label} — ${check.path}`
        );
      }
    }

    // Nastavení: B musí vidět jen svoje companyName, nikdy cizí.
    const settingsRes = await fetchAs(tokenB, "/settings");
    const settingsHtml = await settingsRes.text();
    if (settingsHtml.includes(`Firma-A-${suffix}`)) {
      throw new Error(
        "Únik: /settings uživatele B obsahuje companyName tenanta A"
      );
    }
    if (!settingsHtml.includes(`Firma-B-${suffix}`)) {
      throw new Error(
        "Sanity FAIL: /settings uživatele B neobsahuje jeho vlastní companyName"
      );
    }

    console.log("test-tenant-isolation-http: OK");
  } finally {
    await prisma.tenant.delete({ where: { id: a.tenant.id } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: b.tenant.id } }).catch(() => {});
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
