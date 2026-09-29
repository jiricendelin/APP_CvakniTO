"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  sendSmtpTestEmailAction,
  updateSmtpSettingsAction,
  type SmtpSettingsFormState,
} from "@/app/(app)/settings/smtp/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";
import { SMTP_ENCRYPTIONS } from "@/lib/settings/smtp-schema";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : "Uložit SMTP"}
    </button>
  );
}

function TestButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
    >
      {pending ? "Odesílám…" : "Poslat testovací e-mail"}
    </button>
  );
}

export function SmtpSettingsForm({
  csrf,
  settings,
}: {
  csrf: string;
  settings: TenantSettings;
}) {
  const router = useRouter();
  const [saveState, saveAction] = useActionState<
    SmtpSettingsFormState,
    FormData
  >(updateSmtpSettingsAction, {});

  const [testState, testAction] = useActionState<
    SmtpSettingsFormState,
    FormData
  >(sendSmtpTestEmailAction, {});

  useEffect(() => {
    if (saveState.success) router.refresh();
  }, [saveState.success, router]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <form action={saveAction} className="space-y-4">
        <CsrfField token={csrf} />
        <label className="block space-y-1 text-sm">
          <span className="font-medium">SMTP server</span>
          <input
            name="smtpHost"
            defaultValue={settings.smtpHost}
            placeholder="smtp.example.cz"
            className={fieldClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Port</span>
            <input
              name="smtpPort"
              type="number"
              defaultValue={settings.smtpPort}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Šifrování</span>
            <select
              name="smtpEncryption"
              defaultValue={settings.smtpEncryption}
              className={fieldClass}
            >
              {SMTP_ENCRYPTIONS.map((enc) => (
                <option key={enc} value={enc}>
                  {enc === "ssl" ? "SSL (465)" : "STARTTLS (587)"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Uživatel</span>
          <input
            name="smtpUser"
            autoComplete="off"
            defaultValue={settings.smtpUser}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Heslo</span>
          <input
            name="smtpPassword"
            type="password"
            autoComplete="new-password"
            placeholder={
              settings.smtpPassword ? "•••••••• (nechte prázdné = beze změny)" : ""
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Odesílatel — e-mail</span>
          <input
            name="smtpFromEmail"
            type="email"
            defaultValue={settings.smtpFromEmail}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Odesílatel — jméno</span>
          <input
            name="smtpFromName"
            defaultValue={settings.smtpFromName}
            className={fieldClass}
          />
        </label>
        {saveState.error && (
          <p className="text-sm text-red-700" role="alert">
            {saveState.error}
          </p>
        )}
        {saveState.success && (
          <p className="text-sm text-primary">SMTP nastavení uloženo.</p>
        )}
        <SaveButton />
      </form>

      <form action={testAction} className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <CsrfField token={csrf} />
        <p className="text-sm font-medium">Test odeslání</p>
        <input
          name="testEmail"
          type="email"
          required
          placeholder="kam poslat test"
          className={fieldClass}
        />
        {testState.error && (
          <p className="text-sm text-red-700" role="alert">
            {testState.error}
          </p>
        )}
        {testState.testSent && (
          <p className="text-sm text-primary">Testovací e-mail odeslán.</p>
        )}
        <TestButton />
      </form>
    </div>
  );
}
