import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pragueParts } from "@/lib/time/prague-parts";

const VOUCHER_KIND = "voucher";
const START_VALUE = 52;
const MAX_VALUE = 999;

export function formatVoucherNumber(
  month: number,
  year: number,
  seq: number
): string {
  const mm = String(month).padStart(2, "0");
  const rr = String(year % 100).padStart(2, "0");
  const xxx = String(seq).padStart(3, "0");
  return `${mm}${rr}${xxx}`;
}

export async function ensureVoucherSequence(tenantId: string): Promise<void> {
  await prisma.sequence.upsert({
    where: { tenantId_kind: { tenantId, kind: VOUCHER_KIND } },
    create: {
      tenantId,
      kind: VOUCHER_KIND,
      prefix: "",
      format: "MMRRXXX",
      resetYearly: false,
      nextValue: START_VALUE,
      year: null,
    },
    update: {},
  });
}

/**
 * Přidělí evidenční číslo MMRRXXX.
 * Pořadí XXX se resetuje jen po přetečení 999 → 001 (ne měsíčně).
 */
export async function allocateVoucherNumberInTransaction(
  tx: Prisma.TransactionClient,
  tenantId: string,
  now = new Date()
): Promise<string> {
  await tx.$executeRaw(
    Prisma.sql`
      SELECT id FROM sequences
      WHERE tenant_id = ${tenantId}::uuid AND kind = ${VOUCHER_KIND}
      FOR UPDATE
    `
  );

  const seq = await tx.sequence.findUniqueOrThrow({
    where: { tenantId_kind: { tenantId, kind: VOUCHER_KIND } },
  });

  let value = seq.nextValue;
  if (value < 1 || value > MAX_VALUE) {
    value = 1;
  }

  const p = pragueParts(now);
  const formatted = formatVoucherNumber(p.month, p.year, value);

  const nextValue = value >= MAX_VALUE ? 1 : value + 1;
  await tx.sequence.update({
    where: { id: seq.id },
    data: { nextValue, year: p.year },
  });

  return formatted;
}

export async function previewNextVoucherNumber(
  tenantId: string,
  now = new Date()
): Promise<string> {
  await ensureVoucherSequence(tenantId);
  const seq = await prisma.sequence.findUniqueOrThrow({
    where: { tenantId_kind: { tenantId, kind: VOUCHER_KIND } },
  });
  let value = seq.nextValue;
  if (value < 1 || value > MAX_VALUE) value = 1;
  const p = pragueParts(now);
  return formatVoucherNumber(p.month, p.year, value);
}
