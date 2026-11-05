"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  assignPaymentAction,
  type AssignPaymentState,
} from "@/app/(app)/payments/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk } from "@/lib/money";
import { formatPragueDateTime } from "@/lib/time/format-prague";

export type PaymentRow = {
  id: string;
  moveId: string;
  variableSymbol: string;
  amountCents: number;
  matched: boolean;
  message: string;
  createdAt: Date;
  receiptId: string | null;
  receiptNumber: string | null;
  receiptUnpaid: boolean;
  invoiceId: string | null;
  invoiceNumber: string | null;
};

function AssignSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "…" : "Přiřadit"}
    </button>
  );
}

function AssignForm({
  csrf,
  paymentId,
}: {
  csrf: string;
  paymentId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    AssignPaymentState,
    FormData
  >(assignPaymentAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
      <CsrfField token={csrf} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
        <span className="text-muted-foreground">VS nebo číslo účtenky</span>
        <input
          name="receiptRef"
          required
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          placeholder="např. 20250042"
        />
      </label>
      <AssignSubmitButton />
      {state.error ? (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="w-full text-xs text-green-700">{state.success}</p>
      ) : null}
    </form>
  );
}

export function PaymentsList({
  csrf,
  payments,
}: {
  csrf: string;
  payments: PaymentRow[];
}) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Platby z banky</h1>
      <p className="text-sm text-muted-foreground">
        Párování podle VS z webhooku n8n. Nespárované platby zůstávají v seznamu.
      </p>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatím žádné platby.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {payments.map((p) => (
            <li key={p.id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium tabular-nums">
                  {formatCzk(p.amountCents)}
                </span>
                <span
                  className={
                    p.matched ? "text-primary" : "text-amber-800"
                  }
                >
                  {!p.matched
                    ? "Nespárováno"
                    : p.receiptUnpaid
                      ? "Spárováno · účtenka neuhrazena celá"
                      : "Spárováno"}
                </span>
              </div>
              <p className="text-muted-foreground">
                VS {p.variableSymbol} · move {p.moveId}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPragueDateTime(p.createdAt)}
              </p>
              {p.invoiceId && p.invoiceNumber && (
                <Link
                  href={`/invoices/${p.invoiceId}`}
                  className="text-xs text-primary hover:underline"
                >
                  Faktura {p.invoiceNumber}
                </Link>
              )}
              {p.receiptId && p.receiptNumber && (
                <Link
                  href={`/receipts/${p.receiptId}`}
                  className="text-xs text-primary hover:underline"
                >
                  Účtenka {p.receiptNumber}
                </Link>
              )}
              {p.message && (
                <p className="text-xs text-muted-foreground">{p.message}</p>
              )}
              {!p.matched && (
                <AssignForm csrf={csrf} paymentId={p.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
