"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { createInvoice } from "@/lib/invoices/create-invoice";
import { createInvoiceSchema } from "@/lib/invoices/invoice-schema";
import { PRICE_CATEGORIES } from "@/lib/pricelist/categories";
import { parseCzkInput } from "@/lib/money";
import { pragueStartOfDayUtc } from "@/lib/time/prague";
import {
  allocateSequenceNumberInTransaction,
  ensureSequencesForTenant,
} from "@/lib/sequences/repository";
import { receiptNumberToVariableSymbol } from "@/lib/receipts/variable-symbol";
import { isKonceptNumber } from "@/lib/invoices/status";
import type { Prisma } from "@prisma/client";

export type InvoiceActionState = {
  error?: string;
  success?: boolean;
};

export async function createInvoiceAction(
  _prev: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { error: "Neplatné položky faktury." };
  }

  const parsed = createInvoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    dueDate: formData.get("dueDate"),
    lines: linesRaw,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data faktury.",
    };
  }

  const tenantId = await getTenantId();
  let id: string;
  try {
    id = await createInvoice({
      tenantId,
      customerId: parsed.data.customerId,
      dueDateYmd: parsed.data.dueDate,
      lines: parsed.data.lines,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Fakturu se nepodařilo vytvořit.",
    };
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

async function findOwnedInvoice(tenantId: string, id: string) {
  return prisma.invoice.findFirst({ where: { id, tenantId } });
}

async function recalcInvoiceTotal(
  tx: Prisma.TransactionClient,
  invoiceId: string
): Promise<void> {
  const items = await tx.invoiceItem.findMany({
    where: { invoiceId },
    select: { lineTotalCents: true },
  });
  const totalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
  await tx.invoice.update({ where: { id: invoiceId }, data: { totalCents } });
}

/** Vystavení konceptu: přidělí ostré číslo z řady + VS, zamkne editaci. */
export async function issueInvoiceAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tenantId = await getTenantId();
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId },
    include: { items: { select: { id: true } } },
  });
  if (!invoice || invoice.status !== "koncept") return;
  if (invoice.items.length === 0) return;

  await ensureSequencesForTenant(tenantId);
  await prisma.$transaction(async (tx) => {
    const number = await allocateSequenceNumberInTransaction(
      tx,
      tenantId,
      "invoice"
    );
    const variableSymbol = receiptNumberToVariableSymbol(number);
    await tx.invoice.update({
      where: { id },
      data: {
        number,
        variableSymbol,
        status: "vystavena",
        issuedAt: new Date(),
      },
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

const updateHeaderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid("Vyberte zákazníka."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Zadejte datum splatnosti."),
});

/** Editace hlavičky (zákazník, splatnost) — jen u konceptu. */
export async function updateInvoiceHeaderAction(
  _prev: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = updateHeaderSchema.safeParse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, parsed.data.id);
  if (!invoice) return { error: "Faktura nenalezena." };
  if (invoice.status !== "koncept") {
    return { error: "Upravovat lze jen koncept." };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, tenantId },
    select: { id: true },
  });
  if (!customer) return { error: "Zákazník nenalezen." };

  const dueDate = pragueStartOfDayUtc(parsed.data.dueDate);
  if (!dueDate) return { error: "Neplatné datum splatnosti." };

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { customerId: customer.id, dueDate },
  });

  revalidatePath(`/invoices/${invoice.id}`);
  return { success: true };
}

const itemFieldsSchema = z.object({
  name: z.string().trim().min(1, "Zadejte název položky.").max(200),
  price: z.string(),
  quantity: z.coerce.number().int().min(1).max(9999),
  category: z.enum(PRICE_CATEGORIES),
});

function resolvePriceCents(price: string): number | null {
  const cents = parseCzkInput(price);
  if (cents === null || cents < 0) return null;
  return cents;
}

/** Přidání ruční položky do konceptu. */
export async function addInvoiceItemAction(
  _prev: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return { error: "Chybí ID faktury." };

  const parsed = itemFieldsSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná položka." };
  }
  const priceCents = resolvePriceCents(parsed.data.price);
  if (priceCents === null) return { error: "Zadejte platnou cenu." };

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, invoiceId);
  if (!invoice) return { error: "Faktura nenalezena." };
  if (invoice.status !== "koncept") {
    return { error: "Položky lze upravovat jen u konceptu." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.create({
      data: {
        tenantId,
        invoiceId,
        priceItemId: null,
        name: parsed.data.name,
        priceCents,
        quantity: parsed.data.quantity,
        category: parsed.data.category,
        lineTotalCents: priceCents * parsed.data.quantity,
      },
    });
    await recalcInvoiceTotal(tx, invoiceId);
  });

  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}

const updateItemSchema = itemFieldsSchema.extend({
  itemId: z.string().uuid(),
});

/** Úprava položky konceptu. */
export async function updateInvoiceItemAction(
  _prev: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return { error: "Chybí ID faktury." };

  const parsed = updateItemSchema.safeParse({
    itemId: formData.get("itemId"),
    name: formData.get("name"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná položka." };
  }
  const priceCents = resolvePriceCents(parsed.data.price);
  if (priceCents === null) return { error: "Zadejte platnou cenu." };

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, invoiceId);
  if (!invoice) return { error: "Faktura nenalezena." };
  if (invoice.status !== "koncept") {
    return { error: "Položky lze upravovat jen u konceptu." };
  }

  const item = await prisma.invoiceItem.findFirst({
    where: { id: parsed.data.itemId, invoiceId },
    select: { id: true },
  });
  if (!item) return { error: "Položka nenalezena." };

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.update({
      where: { id: parsed.data.itemId },
      data: {
        name: parsed.data.name,
        priceCents,
        quantity: parsed.data.quantity,
        category: parsed.data.category,
        lineTotalCents: priceCents * parsed.data.quantity,
      },
    });
    await recalcInvoiceTotal(tx, invoiceId);
  });

  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}

/** Smazání položky konceptu. */
export async function deleteInvoiceItemAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (!invoiceId || !itemId) return;

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, invoiceId);
  if (!invoice || invoice.status !== "koncept") return;

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { id: itemId, invoiceId } });
    await recalcInvoiceTotal(tx, invoiceId);
  });

  revalidatePath(`/invoices/${invoiceId}`);
}

/** Duplikace faktury jako nový koncept (kopie položek, nové datum splatnosti). */
export async function duplicateInvoiceAsDraftAction(
  formData: FormData
): Promise<void> {
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tenantId = await getTenantId();
  const source = await prisma.invoice.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!source) return;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const draftNumber = `KONCEPT-${Date.now().toString(36).toUpperCase()}`;

  const created = await prisma.invoice.create({
    data: {
      tenantId,
      customerId: source.customerId,
      number: draftNumber,
      variableSymbol: draftNumber,
      status: "koncept",
      totalCents: source.totalCents,
      dueDate,
      items: {
        create: source.items.map((i) => ({
          tenantId,
          priceItemId: i.priceItemId,
          name: i.name,
          priceCents: i.priceCents,
          quantity: i.quantity,
          category: i.category,
          lineTotalCents: i.lineTotalCents,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${created.id}`);
}

/** Vrácení vystavené (nezaplacené, neodeslané) faktury do konceptu. Číslo zůstává přidělené. */
export async function revertToDraftAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, id);
  if (!invoice) return;
  if (invoice.status !== "vystavena") return;
  if (invoice.paidAt || invoice.sentAt) return;

  await prisma.invoice.update({
    where: { id },
    data: { status: "koncept" },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

/** Zrušení (storno) vystavené/zaplacené faktury. */
export async function cancelInvoiceAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, id);
  if (!invoice) return;
  if (invoice.status === "koncept" || invoice.status === "stornovana") return;

  await prisma.invoice.update({
    where: { id },
    data: { status: "stornovana" },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

/** Smazání konceptu — jen pokud ještě nikdy nedostal reálné číslo z řady. */
export async function deleteDraftAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, id);
  if (!invoice || invoice.status !== "koncept") return;
  if (!isKonceptNumber(invoice.number)) return;

  await prisma.invoice.delete({ where: { id } });

  revalidatePath("/invoices");
  redirect("/invoices");
}

/** Ruční označení faktury jako zaplacené (mimo párování z banky). */
export async function markInvoicePaidAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tenantId = await getTenantId();
  const invoice = await findOwnedInvoice(tenantId, id);
  if (!invoice) return;
  if (invoice.status === "koncept" || invoice.status === "stornovana") return;

  await prisma.invoice.update({
    where: { id },
    data: { status: "zaplacena", paidAt: invoice.paidAt ?? new Date() },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}
