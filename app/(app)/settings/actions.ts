"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import {
  formToSettings,
  settingsFormSchema,
} from "@/lib/settings/schema";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";

export type SettingsFormState = {
  error?: string;
  success?: boolean;
};

export async function updateGeneralSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = settingsFormSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    companyIco: formData.get("companyIco") ?? "",
    companyDic: formData.get("companyDic") ?? "",
    companyAddress: formData.get("companyAddress") ?? "",
    bankAccount: formData.get("bankAccount") ?? "",
    iban: formData.get("iban") ?? "",
    primaryColor: formData.get("primaryColor") ?? "",
  });

  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ?? "Neplatná data formuláře.";
    return { error: msg };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);
  await saveTenantSettings(tenantId, {
    ...current,
    ...formToSettings(parsed.data),
  });
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}
