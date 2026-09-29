"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updatePaymentSettingsAction,
  type SettingsFormState,
} from "@/app/(app)/settings/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Ukládám…" : "Uložit nastavení"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function PaymentSettingsForm({
  csrf,
  settings,
}: {
  csrf: string;
  settings: TenantSettings;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    updatePaymentSettingsAction,
    {}
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="mx-auto w-full max-w-lg space-y-6">
      <CsrfField token={csrf} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Platba</h2>
        <div className="space-y-2">
          <label htmlFor="bankAccount" className="text-sm font-medium">
            Číslo účtu
          </label>
          <input
            id="bankAccount"
            name="bankAccount"
            className={fieldClass}
            placeholder="123456789/0100"
            defaultValue={settings.bankAccount}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="iban" className="text-sm font-medium">
            IBAN
          </label>
          <input
            id="iban"
            name="iban"
            className={fieldClass}
            placeholder="CZ6508000000192000145399"
            defaultValue={settings.iban}
            autoCapitalize="characters"
          />
        </div>
      </section>

      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          Nastavení uloženo.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
