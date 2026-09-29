"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import {
  sendInvoiceEmailAction,
  sendReminderEmailAction,
  sendThanksEmailAction,
  type InvoiceEmailState,
} from "@/app/(app)/invoices/email-actions";
import { CsrfField } from "@/components/csrf-field";
import { SubmitButton } from "@/components/ui/submit-button";

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
      <SubmitButton variant="outline" pendingText="Odesílám…">
        <Mail className="h-4 w-4" />
        {label}
      </SubmitButton>
      {state.error && (
        <p className="text-xs text-destructive" role="alert">
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
    <>
      <EmailForm
        csrf={csrf}
        invoiceId={invoiceId}
        action={sendInvoiceEmailAction}
        label="Odeslat fakturu"
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
    </>
  );
}
