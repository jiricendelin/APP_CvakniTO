"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { isValidSequenceFormat } from "@/lib/sequences/format";
import { isSequenceKind, SEQUENCE_KINDS } from "@/lib/sequences/kinds";

export type SequenceActionState = { error?: string; success?: boolean };

const updateSchema = z.object({
  kind: z.enum(SEQUENCE_KINDS),
  prefix: z.string().max(20),
  format: z.string().max(40),
  resetYearly: z.boolean(),
});

export async function updateSequenceAction(
  _prev: SequenceActionState,
  formData: FormData
): Promise<SequenceActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const kindRaw = String(formData.get("kind") ?? "");
  if (!isSequenceKind(kindRaw)) {
    return { error: "Neplatný typ řady." };
  }

  const resetYearly = formData.get("resetYearly") === "on";

  const parsed = updateSchema.safeParse({
    kind: kindRaw,
    prefix: String(formData.get("prefix") ?? "").trim(),
    format: String(formData.get("format") ?? "").trim(),
    resetYearly,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data formuláře.",
    };
  }

  if (!isValidSequenceFormat(parsed.data.format)) {
    return {
      error: "Formát musí obsahovat {N…}, např. {YYYY}{NNNN}.",
    };
  }

  const tenantId = await getTenantId();
  const existing = await prisma.sequence.findUnique({
    where: { tenantId_kind: { tenantId, kind: kindRaw } },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Řada nenalezena." };
  }

  await prisma.sequence.update({
    where: { id: existing.id },
    data: {
      prefix: parsed.data.prefix,
      format: parsed.data.format,
      resetYearly: parsed.data.resetYearly,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
