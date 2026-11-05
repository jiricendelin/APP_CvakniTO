"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createGiftCustomerAction,
  createStornoReceiptAction,
  deleteGiftCustomerAction,
  updateGiftCustomerAction,
  type GiftCustomerActionState,
} from "@/app/(app)/gift-customers/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk } from "@/lib/money";

export type GiftCustomerRow = {
  id: string;
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  note: string;
  awaitingStornoPayment: boolean;
  stornoFeeCents: number;
};

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

function centsToInput(cents: number): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function CustomerForm({
  csrf,
  customer,
  action,
}: {
  csrf: string;
  customer?: GiftCustomerRow;
  action: (
    prev: GiftCustomerActionState,
    formData: FormData
  ) => Promise<GiftCustomerActionState>;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <CsrfField token={csrf} />
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="lastName"
          placeholder="Příjmení"
          required
          defaultValue={customer?.lastName}
          className={fieldClass}
        />
        <input
          name="firstName"
          placeholder="Jméno"
          required
          defaultValue={customer?.firstName}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="phone"
          placeholder="Telefon"
          defaultValue={customer?.phone}
          className={fieldClass}
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          defaultValue={customer?.email}
          className={fieldClass}
        />
      </div>
      <textarea
        name="note"
        rows={2}
        placeholder="Poznámka"
        defaultValue={customer?.note}
        className={fieldClass}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="awaitingStornoPayment"
          value="true"
          defaultChecked={customer?.awaitingStornoPayment}
        />
        Čekáme na úhradu stornopoplatku
      </label>
      <input
        name="stornoFee"
        placeholder="Výše stornopoplatku (Kč)"
        defaultValue={customer ? centsToInput(customer.stornoFeeCents) : ""}
        className={fieldClass}
      />
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <SubmitButton label={customer ? "Uložit" : "Přidat zákazníka DP"} />
    </form>
  );
}

function StornoForm({
  csrf,
  customer,
}: {
  csrf: string;
  customer: GiftCustomerRow;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createStornoReceiptAction, {});

  useEffect(() => {
    if (state.receiptId) {
      router.push(`/receipts/${state.receiptId}`);
      router.refresh();
    } else if (state.success) {
      router.refresh();
    }
  }, [state.receiptId, state.success, router]);

  return (
    <form action={formAction} className="mt-3 space-y-2 rounded-md bg-muted/40 p-3">
      <CsrfField token={csrf} />
      <input type="hidden" name="giftCustomerId" value={customer.id} />
      <p className="text-sm font-medium">Vystavit storno účtenku</p>
      <input
        name="amount"
        required
        placeholder="Částka (Kč)"
        defaultValue={
          customer.stornoFeeCents
            ? centsToInput(customer.stornoFeeCents)
            : ""
        }
        className={fieldClass}
      />
      <input
        name="description"
        placeholder="Popis (volitelné)"
        className={fieldClass}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendEmail" value="true" defaultChecked />
        Odeslat e-mailem
      </label>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton label="Vystavit storno" />
    </form>
  );
}

export function GiftCustomersManager({
  csrf,
  customers,
}: {
  csrf: string;
  customers: GiftCustomerRow[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stornoId, setStornoId] = useState<string | null>(null);
  const [delState, delAction] = useActionState(deleteGiftCustomerAction, {});

  useEffect(() => {
    if (delState.success) router.refresh();
  }, [delState.success, router]);

  return (
    <div className="space-y-6">
      <CustomerForm csrf={csrf} action={createGiftCustomerAction} />

      <div className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádní zákazníci DP.</p>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {c.lastName} {c.firstName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </p>
                  {c.awaitingStornoPayment ? (
                    <p className="mt-1 text-sm text-amber-700">
                      Čeká storno: {formatCzk(c.stornoFeeCents)}
                    </p>
                  ) : null}
                  {c.note ? (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{c.note}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm"
                    onClick={() =>
                      setEditingId(editingId === c.id ? null : c.id)
                    }
                  >
                    Upravit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 text-sm"
                    onClick={() =>
                      setStornoId(stornoId === c.id ? null : c.id)
                    }
                  >
                    Storno účtenka
                  </button>
                  <form action={delAction}>
                    <CsrfField token={csrf} />
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-destructive/40 px-3 py-1 text-sm text-destructive"
                    >
                      Smazat
                    </button>
                  </form>
                </div>
              </div>
              {editingId === c.id ? (
                <div className="mt-3">
                  <CustomerForm
                    csrf={csrf}
                    customer={c}
                    action={updateGiftCustomerAction}
                  />
                </div>
              ) : null}
              {stornoId === c.id ? (
                <StornoForm csrf={csrf} customer={c} />
              ) : null}
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Fakturující zákazníci jsou v sekci{" "}
        <Link href="/customers" className="underline">
          Zákazníci FA
        </Link>
        .
      </p>
    </div>
  );
}
