"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { parseCzkInput } from "@/lib/money";
import { PRICE_CATEGORIES } from "@/lib/pricelist/categories";

export type PricelistActionState = {
  error?: string;
  success?: boolean;
};

const categorySchema = z.enum(PRICE_CATEGORIES, {
  errorMap: () => ({ message: "Vyberte kategorii." }),
});

async function assertItemOwned(tenantId: string, id: string) {
  const item = await prisma.priceItem.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!item) throw new Error("Položka nenalezena.");
}

export async function createPriceItemAction(
  _prev: PricelistActionState,
  formData: FormData
): Promise<PricelistActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Zadejte název položky." };

  const priceRaw = String(formData.get("price") ?? "");
  const priceCents = parseCzkInput(priceRaw);
  if (priceCents === null || priceCents < 0) {
    return { error: "Zadejte cenu v Kč (např. 800 nebo 800,50)." };
  }

  const categoryParsed = categorySchema.safeParse(formData.get("category"));
  if (!categoryParsed.success) {
    return { error: categoryParsed.error.issues[0]?.message ?? "Neplatná kategorie." };
  }

  const tenantId = await getTenantId();
  const maxOrder = await prisma.priceItem.aggregate({
    where: { tenantId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? 0) + 10;

  await prisma.priceItem.create({
    data: {
      tenantId,
      name,
      priceCents,
      category: categoryParsed.data,
      sortOrder,
      active: true,
    },
  });

  revalidatePath("/settings/pricelist");
  return { success: true };
}

export async function updatePriceItemAction(
  _prev: PricelistActionState,
  formData: FormData
): Promise<PricelistActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID položky." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Zadejte název položky." };

  const priceRaw = String(formData.get("price") ?? "");
  const priceCents = parseCzkInput(priceRaw);
  if (priceCents === null || priceCents < 0) {
    return { error: "Zadejte cenu v Kč (např. 800 nebo 800,50)." };
  }

  const categoryParsed = categorySchema.safeParse(formData.get("category"));
  if (!categoryParsed.success) {
    return { error: categoryParsed.error.issues[0]?.message ?? "Neplatná kategorie." };
  }

  const sortRaw = String(formData.get("sortOrder") ?? "0").trim();
  const sortOrder = parseInt(sortRaw, 10);
  if (!Number.isFinite(sortOrder)) {
    return { error: "Pořadí musí být celé číslo." };
  }

  const tenantId = await getTenantId();
  try {
    await assertItemOwned(tenantId, id);
  } catch {
    return { error: "Položka nenalezena." };
  }

  await prisma.priceItem.update({
    where: { id },
    data: {
      name,
      priceCents,
      category: categoryParsed.data,
      sortOrder,
    },
  });

  revalidatePath("/settings/pricelist");
  return { success: true };
}

export async function setPriceItemActiveAction(
  _prev: PricelistActionState,
  formData: FormData
): Promise<PricelistActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return { error: "Chybí ID položky." };

  const tenantId = await getTenantId();
  try {
    await assertItemOwned(tenantId, id);
  } catch {
    return { error: "Položka nenalezena." };
  }

  await prisma.priceItem.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/settings/pricelist");
  return { success: true };
}
