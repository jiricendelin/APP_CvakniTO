"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { mailTemplatesFormSchema } from "@/lib/mail/template-schema";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";

export type EmailTemplatesFormState = {
  error?: string;
  success?: boolean;
};

export async function updateEmailTemplatesAction(
  _prev: EmailTemplatesFormState,
  formData: FormData
): Promise<EmailTemplatesFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = mailTemplatesFormSchema.safeParse({
    mailInvoiceSubject: formData.get("mailInvoiceSubject") ?? "",
    mailInvoiceText: formData.get("mailInvoiceText") ?? "",
    mailInvoiceHtml: formData.get("mailInvoiceHtml") ?? "",
    mailReminderSubject: formData.get("mailReminderSubject") ?? "",
    mailReminderText: formData.get("mailReminderText") ?? "",
    mailReminderHtml: formData.get("mailReminderHtml") ?? "",
    mailThanksSubject: formData.get("mailThanksSubject") ?? "",
    mailThanksText: formData.get("mailThanksText") ?? "",
    mailThanksHtml: formData.get("mailThanksHtml") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data šablon.",
    };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);
  await saveTenantSettings(tenantId, { ...current, ...parsed.data });

  revalidatePath("/settings/email-templates");
  return { success: true };
}
