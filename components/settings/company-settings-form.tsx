"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updateCompanySettingsAction,
  type SettingsFormState,
} from "@/app/(app)/settings/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/color";

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

export function CompanySettingsForm({
  csrf,
  settings,
}: {
  csrf: string;
  settings: TenantSettings;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    updateCompanySettingsAction,
    {}
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const color = settings.primaryColor || DEFAULT_PRIMARY_COLOR;

  return (
    <form action={formAction} className="mx-auto w-full max-w-lg space-y-6">
      <CsrfField token={csrf} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Firma</h2>
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium">
            Název firmy
          </label>
          <input
            id="companyName"
            name="companyName"
            className={fieldClass}
            defaultValue={settings.companyName}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="companyIco" className="text-sm font-medium">
              IČO
            </label>
            <input
              id="companyIco"
              name="companyIco"
              className={fieldClass}
              defaultValue={settings.companyIco}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="companyDic" className="text-sm font-medium">
              DIČ
            </label>
            <input
              id="companyDic"
              name="companyDic"
              className={fieldClass}
              defaultValue={settings.companyDic}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="companyAddress" className="text-sm font-medium">
            Adresa
          </label>
          <textarea
            id="companyAddress"
            name="companyAddress"
            rows={3}
            className={fieldClass}
            defaultValue={settings.companyAddress}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Vzhled</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <label htmlFor="primaryColorPicker" className="text-sm font-medium">
              Primární barva
            </label>
            <input
              id="primaryColorPicker"
              type="color"
              defaultValue={color}
              className="h-11 w-full min-w-[3rem] cursor-pointer rounded-md border border-input bg-background p-1"
              onChange={(e) => {
                const text = document.getElementById(
                  "primaryColor"
                ) as HTMLInputElement | null;
                if (text) text.value = e.target.value;
              }}
            />
          </div>
          <div className="min-w-[8rem] flex-1 space-y-2">
            <label htmlFor="primaryColor" className="text-sm font-medium">
              Hex
            </label>
            <input
              id="primaryColor"
              name="primaryColor"
              className={fieldClass}
              defaultValue={color}
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
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
