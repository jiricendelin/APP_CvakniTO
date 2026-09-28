"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { createInvoice } from "@/lib/invoices/create-invoice";
import { createInvoiceSchema } from "@/lib/invoices/invoice-schema";

export type InvoiceActionState = {
  error?: string;
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
      error:
        parsed.error.issues[0]?.message ?? "Neplatná data faktury.",
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
