/**
 * Ověření R9: 20 paralelních přidělení = 20 různých po sobě jdoucích čísel.
 *
 *   npm run test:sequences
 *   npm run test:sequences -- [tenantId]
 */
import { PrismaClient } from "@prisma/client";
import { allocateSequenceNumber } from "../lib/sequences/repository";

const prisma = new PrismaClient();

function trailingDigits(s: string): number {
  const m = s.match(/(\d+)\D*$/);
  return m ? parseInt(m[1]!, 10) : NaN;
}

async function main() {
  const tenantArg = process.argv[2];
  let tenantId = tenantArg;

  if (!tenantId) {
    const tenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!tenant) throw new Error("V DB není tenant.");
    tenantId = tenant.id;
  }

  console.log(`Tenant: ${tenantId}`);
  console.log("Spouštím 20 paralelních allocateSequenceNumber(receipt)…");

  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      allocateSequenceNumber(tenantId!, "receipt")
    )
  );

  const unique = new Set(results);
  if (unique.size !== 20) {
    console.error("FAIL: duplicitní čísla", results);
    process.exit(1);
  }

  const nums = results.map(trailingDigits).sort((a, b) => a - b);
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1]! + 1) {
      console.error("FAIL: nejsou po sobě", nums);
      process.exit(1);
    }
  }

  console.log("OK:", results[0], "…", results[19]);
  console.log("Pořadí:", nums.join(", "));
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
