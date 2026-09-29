"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  companySettingsFormSchema,
  formToCompanySettings,
  paymentSettingsFormSchema,
  formToPaymentSettings,
} from "@/lib/settings/schema";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";

export type SettingsFormState = {
  error?: string;
  success?: boolean;
};

export async function updateCompanySettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = companySettingsFormSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    companyIco: formData.get("companyIco") ?? "",
    companyDic: formData.get("companyDic") ?? "",
    companyAddress: formData.get("companyAddress") ?? "",
    primaryColor: formData.get("primaryColor") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data formuláře." };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);
  await saveTenantSettings(tenantId, {
    ...current,
    ...formToCompanySettings(parsed.data),
  });
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}

export async function updatePaymentSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = paymentSettingsFormSchema.safeParse({
    bankAccount: formData.get("bankAccount") ?? "",
    iban: formData.get("iban") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data formuláře." };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);
  await saveTenantSettings(tenantId, {
    ...current,
    ...formToPaymentSettings(parsed.data),
  });
  revalidatePath("/settings");
  return { success: true };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Zadejte současné heslo."),
    newPassword: z.string().min(8, "Nové heslo musí mít alespoň 8 znaků."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hesla se neshodují.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatná data." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Nejste přihlášeni." };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!dbUser) return { error: "Uživatel nenalezen." };

  const ok = await verifyPassword(dbUser.passwordHash, parsed.data.currentPassword);
  if (!ok) return { error: "Současné heslo nesouhlasí." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}
