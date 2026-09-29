"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { formatSmtpError, sendMail } from "@/lib/mail/send";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";
import { getSmtpSettingsFromTenant } from "@/lib/settings/smtp-from-tenant";
import { smtpFormSchema } from "@/lib/settings/smtp-schema";

export type SmtpSettingsFormState = {
  error?: string;
  success?: boolean;
  testSent?: boolean;
};

export async function updateSmtpSettingsAction(
  _prev: SmtpSettingsFormState,
  formData: FormData
): Promise<SmtpSettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = smtpFormSchema().safeParse({
    smtpHost: formData.get("smtpHost") ?? "",
    smtpPort: formData.get("smtpPort") ?? "587",
    smtpEncryption: formData.get("smtpEncryption") ?? "starttls",
    smtpUser: formData.get("smtpUser") ?? "",
    smtpPassword: formData.get("smtpPassword") ?? "",
    smtpFromEmail: formData.get("smtpFromEmail") ?? "",
    smtpFromName: formData.get("smtpFromName") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data SMTP.",
    };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);

  const passwordIncoming = parsed.data.smtpPassword;
  const smtpPassword =
    passwordIncoming.trim().length > 0
      ? passwordIncoming
      : current.smtpPassword;

  await saveTenantSettings(tenantId, {
    ...current,
    smtpHost: parsed.data.smtpHost.trim(),
    smtpPort: parsed.data.smtpPort,
    smtpEncryption: parsed.data.smtpEncryption,
    smtpUser: parsed.data.smtpUser.trim(),
    smtpPassword,
    smtpFromEmail: parsed.data.smtpFromEmail.trim(),
    smtpFromName: parsed.data.smtpFromName.trim(),
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function sendSmtpTestEmailAction(
  _prev: SmtpSettingsFormState,
  formData: FormData
): Promise<SmtpSettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const to = String(formData.get("testEmail") ?? "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: "Zadejte platnou testovací e-mailovou adresu." };
  }

  const tenantId = await getTenantId();
  const settings = getSmtpSettingsFromTenant(await getTenantSettings(tenantId));

  try {
    await sendMail({
      settings,
      to,
      subject: "CvakniTO — test SMTP",
      text: "Toto je testovací zpráva z CvakniTO. SMTP funguje.",
    });
    return { testSent: true };
  } catch (e) {
    return { error: formatSmtpError(e) };
  }
}
