"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateEmailTemplatesAction,
  type EmailTemplatesFormState,
} from "@/app/(app)/settings/email-templates/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const VARS =
  "{{companyName}}, {{customerName}}, {{invoiceNumber}}, {{variableSymbol}}, {{totalCzk}}, {{dueDate}}";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : "Uložit šablony"}
    </button>
  );
}

function TemplateBlock({
  title,
  subjectName,
  textName,
  htmlName,
  settings,
}: {
  title: string;
  subjectName: keyof TenantSettings;
  textName: keyof TenantSettings;
  htmlName: keyof TenantSettings;
  settings: TenantSettings;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      <input
        name={subjectName}
        defaultValue={String(settings[subjectName] ?? "")}
        placeholder="Předmět"
        className={fieldClass}
      />
      <textarea
        name={textName}
        rows={5}
        defaultValue={String(settings[textName] ?? "")}
        placeholder="Text e-mailu"
        className={fieldClass}
      />
      <textarea
        name={htmlName}
        rows={3}
        defaultValue={String(settings[htmlName] ?? "")}
        placeholder="HTML (volitelné — prázdné = z textu)"
        className={fieldClass}
      />
    </fieldset>
  );
}

export function EmailTemplatesForm({
  csrf,
  settings,
}: {
  csrf: string;
  settings: TenantSettings;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    EmailTemplatesFormState,
    FormData
  >(updateEmailTemplatesAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <Link href="/settings" className="text-sm text-primary hover:underline">
        ← Nastavení
      </Link>
      <p className="text-xs text-muted-foreground">Proměnné: {VARS}</p>
      <form action={formAction} className="space-y-4">
        <CsrfField token={csrf} />
        <TemplateBlock
          title="Faktura"
          subjectName="mailInvoiceSubject"
          textName="mailInvoiceText"
          htmlName="mailInvoiceHtml"
          settings={settings}
        />
        <TemplateBlock
          title="Upomínka"
          subjectName="mailReminderSubject"
          textName="mailReminderText"
          htmlName="mailReminderHtml"
          settings={settings}
        />
        <TemplateBlock
          title="Poděkování"
          subjectName="mailThanksSubject"
          textName="mailThanksText"
          htmlName="mailThanksHtml"
          settings={settings}
        />
        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-primary">Šablony uloženy.</p>
        )}
        <SubmitButton />
      </form>
    </div>
  );
}
