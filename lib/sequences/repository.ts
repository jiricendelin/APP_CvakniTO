import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pragueYear } from "@/lib/time/prague";
import {
  formatSequenceNumber,
  previewNextSequenceNumber,
} from "./format";
import { SEQUENCE_KINDS, type SequenceKind } from "./kinds";

export type SequenceConfig = {
  id: string;
  kind: string;
  prefix: string;
  format: string;
  resetYearly: boolean;
  nextValue: number;
  year: number | null;
};

const DEFAULTS: Record<
  SequenceKind,
  { prefix: string; format: string; resetYearly: boolean }
> = {
  receipt: { prefix: "", format: "{YYYY}{NNNN}", resetYearly: true },
  invoice: { prefix: "F", format: "{YYYY}{NNNN}", resetYearly: true },
};

export async function ensureSequencesForTenant(tenantId: string) {
  const year = pragueYear();
  for (const kind of SEQUENCE_KINDS) {
    const d = DEFAULTS[kind];
    await prisma.sequence.upsert({
      where: { tenantId_kind: { tenantId, kind } },
      create: {
        tenantId,
        kind,
        prefix: d.prefix,
        format: d.format,
        resetYearly: d.resetYearly,
        nextValue: 1,
        year,
      },
      update: {},
    });
  }
}

export async function listSequences(tenantId: string): Promise<SequenceConfig[]> {
  await ensureSequencesForTenant(tenantId);
  const rows = await prisma.sequence.findMany({
    where: { tenantId },
    orderBy: { kind: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    prefix: r.prefix,
    format: r.format,
    resetYearly: r.resetYearly,
    nextValue: r.nextValue,
    year: r.year,
  }));
}

export function sequencePreview(config: SequenceConfig): string {
  return previewNextSequenceNumber(
    config.prefix,
    config.format,
    config.nextValue,
    config.resetYearly,
    config.year
  );
}

export async function allocateSequenceNumberInTransaction(
  tx: Prisma.TransactionClient,
  tenantId: string,
  kind: SequenceKind
): Promise<string> {
  await tx.$executeRaw(
    Prisma.sql`
      SELECT id FROM sequences
      WHERE tenant_id = ${tenantId}::uuid AND kind = ${kind}
      FOR UPDATE
    `
  );

  const seq = await tx.sequence.findUniqueOrThrow({
    where: { tenantId_kind: { tenantId, kind } },
  });

  const currentYear = pragueYear();
  let value = seq.nextValue;
  let storedYear = seq.year;

  if (seq.resetYearly) {
    if (storedYear === null || storedYear !== currentYear) {
      value = 1;
      storedYear = currentYear;
    }
  } else if (storedYear === null) {
    storedYear = currentYear;
  }

  const formatted = formatSequenceNumber(
    seq.prefix,
    seq.format,
    value,
    currentYear
  );

  await tx.sequence.update({
    where: { id: seq.id },
    data: {
      nextValue: value + 1,
      year: storedYear,
    },
  });

  return formatted;
}

/** Atomické přidělení dalšího čísla (FOR UPDATE). */
export async function allocateSequenceNumber(
  tenantId: string,
  kind: SequenceKind
): Promise<string> {
  await ensureSequencesForTenant(tenantId);

  return prisma.$transaction(async (tx) =>
    allocateSequenceNumberInTransaction(tx, tenantId, kind)
  );
}
