"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { normalizeIco } from "@/lib/ares/ico";

export type CustomerActionState = {
  error?: string;
  success?: boolean;
};

const customerFieldsSchema = z.object({
  name: z.string().trim().min(1, "Zadejte název / jméno.").max(200),
  ico: z.string().max(20).optional().default(""),
  dic: z.string().max(20).optional().default(""),
  address: z.string().max(500).optional().default(""),
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  note: z.string().max(2000).optional().default(""),
});

function trimFields(data: z.infer<typeof customerFieldsSchema>) {
  return {
    name: data.name.trim(),
    ico: normalizeIco(data.ico ?? ""),
    dic: data.dic?.trim() ?? "",
    address: data.address?.trim() ?? "",
    email: data.email?.trim() ?? "",
    phone: data.phone?.trim() ?? "",
    note: data.note?.trim() ?? "",
  };
}

async function assertCustomerOwned(tenantId: string, id: string) {
  const row = await prisma.customer.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!row) throw new Error("Zákazník nenalezen.");
}

export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = customerFieldsSchema.safeParse({
    name: formData.get("name"),
    ico: formData.get("ico"),
    dic: formData.get("dic"),
    address: formData.get("address"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data.",
    };
  }

  const tenantId = await getTenantId();
  await prisma.customer.create({
    data: { tenantId, ...trimFields(parsed.data) },
  });

  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID zákazníka." };

  const parsed = customerFieldsSchema.safeParse({
    name: formData.get("name"),
    ico: formData.get("ico"),
    dic: formData.get("dic"),
    address: formData.get("address"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data.",
    };
  }

  const tenantId = await getTenantId();
  try {
    await assertCustomerOwned(tenantId, id);
  } catch {
    return { error: "Zákazník nenalezen." };
  }

  await prisma.customer.update({
    where: { id },
    data: trimFields(parsed.data),
  });

  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Chybí ID zákazníka." };

  const tenantId = await getTenantId();
  try {
    await assertCustomerOwned(tenantId, id);
  } catch {
    return { error: "Zákazník nenalezen." };
  }

  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  return { success: true };
}
