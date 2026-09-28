"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  sendInvoiceEmailAction,
  sendReminderEmailAction,
  sendThanksEmailAction,
  type InvoiceEmailState,
} from "@/app/(app)/invoices/email-actions";
import { CsrfField } from "@/components/csrf-field";

function EmailButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
    >
      {pending ? "Odesílám…" : label}
    </button>
  );
}

function EmailForm({
  csrf,
  invoiceId,
  action,
  label,
}: {
  csrf: string;
  invoiceId: string;
  action: (
    prev: InvoiceEmailState,
    formData: FormData
  ) => Promise<InvoiceEmailState>;
  label: string;
}) {
  const [state, formAction] = useActionState<InvoiceEmailState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-1">
      <CsrfField token={csrf} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <EmailButton label={label} />
      {state.error && (
        <p className="text-xs text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-xs text-primary" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}

export function InvoiceEmailActions({
  csrf,
  invoiceId,
}: {
  csrf: string;
  invoiceId: string;
}) {
  return (
    <section className="space-y-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">E-mail zákazníkovi</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <EmailForm
          csrf={csrf}
          invoiceId={invoiceId}
          action={sendInvoiceEmailAction}
          label="Odeslat fakturu (PDF)"
        />
        <EmailForm
          csrf={csrf}
          invoiceId={invoiceId}
          action={sendReminderEmailAction}
          label="Upomínka"
        />
        <EmailForm
          csrf={csrf}
          invoiceId={invoiceId}
          action={sendThanksEmailAction}
          label="Poděkování"
        />
      </div>
    </section>
  );
}
