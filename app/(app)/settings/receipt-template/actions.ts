"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { validateReceiptTemplate } from "@/lib/receipt-template/render";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";
import { receiptTemplateFormSchema } from "@/lib/settings/schema";

export type ReceiptTemplateFormState = {
  error?: string;
  success?: boolean;
};

export async function updateReceiptTemplateAction(
  _prev: ReceiptTemplateFormState,
  formData: FormData
): Promise<ReceiptTemplateFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = receiptTemplateFormSchema.safeParse({
    receiptTemplate: formData.get("receiptTemplate") ?? "",
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Neplatná data formuláře.",
    };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);

  const validated = validateReceiptTemplate(
    parsed.data.receiptTemplate,
    current
  );
  if (!validated.ok) {
    return { error: validated.error };
  }

  await saveTenantSettings(tenantId, {
    ...current,
    receiptTemplate: parsed.data.receiptTemplate,
  });

  revalidatePath("/settings/receipt-template");
  return { success: true };
}
