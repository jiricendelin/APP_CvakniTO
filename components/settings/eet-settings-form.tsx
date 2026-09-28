"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  removeEetCertAction,
  updateEetConfigAction,
  uploadEetCertAction,
  type EetSettingsFormState,
} from "@/app/(app)/settings/eet/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function EetSettingsForm({
  csrf,
  settings,
  hasCert,
}: {
  csrf: string;
  settings: TenantSettings;
  hasCert: boolean;
}) {
  const router = useRouter();
  const [configState, configAction] = useActionState<
    EetSettingsFormState,
    FormData
  >(updateEetConfigAction, {});
  const [uploadState, uploadAction] = useActionState<
    EetSettingsFormState,
    FormData
  >(uploadEetCertAction, {});
  const [removeState, removeAction] = useActionState<
    EetSettingsFormState,
    FormData
  >(removeEetCertAction, {});

  const feedback =
    configState.error ||
    uploadState.error ||
    removeState.error ||
    (configState.success || uploadState.success || removeState.success
      ? "Uloženo."
      : undefined);

  useEffect(() => {
    if (configState.success || uploadState.success || removeState.success) {
      router.refresh();
    }
  }, [configState.success, uploadState.success, removeState.success, router]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      {feedback && (
        <p
          className={
            feedback === "Uloženo."
              ? "text-sm text-green-700 dark:text-green-400"
              : "text-sm text-destructive"
          }
        >
          {feedback}
        </p>
      )}

      <form action={configAction} className="space-y-4 rounded-lg border border-border p-4">
        <CsrfField token={csrf} />
        <label className="block space-y-1 text-sm">
          <span className="font-medium">ID provozovny</span>
          <input
            name="eetPremiseId"
            defaultValue={settings.eetPremiseId}
            className={fieldClass}
            inputMode="numeric"
            required
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">ID pokladny</span>
          <input
            name="eetRegisterId"
            defaultValue={settings.eetRegisterId}
            className={fieldClass}
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="eetPlayground"
            defaultChecked={settings.eetPlayground}
          />
          Playground (testovací prostředí)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="eetAutoSend"
            defaultChecked={settings.eetAutoSend}
          />
          Odeslat do EET automaticky po zaplacení
        </label>
        <SubmitButton label="Uložit nastavení EET" pendingLabel="Ukládám…" />
      </form>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Certifikát (.p12)</h2>
        {hasCert ? (
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-muted-foreground">Stav</dt>
              <dd>Nahrán</dd>
            </div>
            {settings.eetCertSubject ? (
              <div>
                <dt className="text-muted-foreground">Vlastník (CN)</dt>
                <dd className="break-all font-mono text-xs">
                  {settings.eetCertSubject}
                </dd>
              </div>
            ) : null}
            {settings.eetTaxpayerId ? (
              <div>
                <dt className="text-muted-foreground">EIC</dt>
                <dd className="font-mono">{settings.eetTaxpayerId}</dd>
              </div>
            ) : null}
            {settings.eetCertValidTo ? (
              <div>
                <dt className="text-muted-foreground">Platnost do</dt>
                <dd>{settings.eetCertValidTo}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Certifikát zatím není nahrán.</p>
        )}

        <form action={uploadAction} className="space-y-3" encType="multipart/form-data">
          <CsrfField token={csrf} />
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Soubor .p12</span>
            <input
              type="file"
              name="certFile"
              accept=".p12,.pfx"
              className="block w-full text-sm"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Heslo k certifikátu</span>
            <input
              type="password"
              name="certPassword"
              autoComplete="new-password"
              className={fieldClass}
            />
          </label>
          <SubmitButton label="Nahrát certifikát" pendingLabel="Nahrávám…" />
        </form>

        {hasCert && (
          <form action={removeAction}>
            <CsrfField token={csrf} />
            <button
              type="submit"
              className="text-sm text-destructive hover:underline"
            >
              Odebrat certifikát ze serveru
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
