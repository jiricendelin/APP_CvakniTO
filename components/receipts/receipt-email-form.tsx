"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  sendReceiptEmailAction,
  type ReceiptEmailState,
} from "@/app/(app)/receipts/email-actions";
import { CsrfField } from "@/components/csrf-field";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Odesílám…" : "Odeslat účtenku e-mailem"}
    </button>
  );
}

export function ReceiptEmailForm({
  csrf,
  receiptId,
}: {
  csrf: string;
  receiptId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ReceiptEmailState, FormData>(
    sendReceiptEmailAction,
    {}
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <CsrfField token={csrf} />
      <input type="hidden" name="receiptId" value={receiptId} />
      <p className="text-sm font-medium">Odeslat e-mailem</p>
      <input
        name="to"
        type="email"
        required
        placeholder="E-mail zákazníka"
        className={fieldClass}
      />
      <input
        name="customerName"
        placeholder="Jméno (volitelné)"
        className={fieldClass}
      />
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
