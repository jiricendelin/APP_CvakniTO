"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updateMailSignatureAndImapAction,
  type MailExtraFormState,
} from "@/app/(app)/settings/mail-extra/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : "Uložit podpis a IMAP"}
    </button>
  );
}

export function MailSignatureImapForm({
  csrf,
  settings,
}: {
  csrf: string;
  settings: TenantSettings;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<MailExtraFormState, FormData>(
    updateMailSignatureAndImapAction,
    {}
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="mx-auto w-full max-w-lg space-y-4">
      <CsrfField token={csrf} />
      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Podpis e-mailu</legend>
        <label className="block space-y-1 text-sm">
          <span>HTML</span>
          <textarea
            name="mailSignatureHtml"
            rows={4}
            defaultValue={settings.mailSignatureHtml}
            className={fieldClass}
            placeholder="<p>S pozdravem…</p>"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Plain text</span>
          <textarea
            name="mailSignatureText"
            rows={3}
            defaultValue={settings.mailSignatureText}
            className={fieldClass}
            placeholder="S pozdravem…"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">
          Kopie do Odeslané (IMAP)
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="imapEnabled"
            value="true"
            defaultChecked={settings.imapEnabled}
          />
          Ukládat odeslané e-maily do schránky
        </label>
        <label className="block space-y-1 text-sm">
          <span>IMAP host (prázdné = SMTP host)</span>
          <input
            name="imapHost"
            defaultValue={settings.imapHost}
            className={fieldClass}
            placeholder="imap.example.cz"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 text-sm">
            <span>Port</span>
            <input
              name="imapPort"
              type="number"
              defaultValue={settings.imapPort}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>SSL</span>
            <select
              name="imapSecure"
              defaultValue={settings.imapSecure ? "true" : "false"}
              className={fieldClass}
            >
              <option value="true">Ano (993)</option>
              <option value="false">Ne</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span>Složka Odeslané</span>
          <input
            name="imapSentFolder"
            defaultValue={settings.imapSentFolder || "Sent"}
            className={fieldClass}
            placeholder="Sent / Odeslaná pošta"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Přihlášení bere stejné údaje jako SMTP.
        </p>
      </fieldset>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-700">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
