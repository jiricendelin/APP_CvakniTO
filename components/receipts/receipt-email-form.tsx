"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CsrfField } from "@/components/csrf-field";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export type GiftCustomerOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function ReceiptEmailForm({
  csrf,
  receiptId,
  giftCustomers,
}: {
  csrf: string;
  receiptId: string;
  giftCustomers: GiftCustomerOption[];
}) {
  const router = useRouter();
  const [giftCustomerId, setGiftCustomerId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const selected = useMemo(
    () => giftCustomers.find((c) => c.id === giftCustomerId),
    [giftCustomerId, giftCustomers]
  );
  const manualMode = !giftCustomerId;
  const selectedMissingEmail = selected && !selected.email.trim();
  const submitDisabled = pending || (!manualMode && !!selectedMissingEmail);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const res = await fetch(`/api/receipts/${receiptId}/email`, {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = (await res.json()) as { error?: string; success?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Odeslání e-mailu selhalo.");
        return;
      }
      setSuccess(data.success ?? "E-mail odeslán.");
      router.refresh();
    } catch {
      setError("Odeslání e-mailu selhalo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <CsrfField token={csrf} />
      <input type="hidden" name="giftCustomerId" value={giftCustomerId} />

      <p className="text-sm font-medium">Odeslat e-mailem</p>

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Zákazník DP</span>
        <select
          className={fieldClass}
          value={giftCustomerId}
          onChange={(e) => setGiftCustomerId(e.target.value)}
        >
          <option value="">— Ručně / nový e-mail —</option>
          {giftCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.lastName} {c.firstName}
              {c.email ? ` · ${c.email}` : ""}
            </option>
          ))}
        </select>
      </label>

      <RecipientFields
        manualMode={manualMode}
        selected={selected}
        selectedMissingEmail={!!selectedMissingEmail}
        fieldClass={fieldClass}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
      <button
        type="submit"
        disabled={submitDisabled}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Odesílám…" : "Odeslat účtenku e-mailem"}
      </button>
    </form>
  );
}

function RecipientFields({
  manualMode,
  selected,
  selectedMissingEmail,
  fieldClass,
}: {
  manualMode: boolean;
  selected: GiftCustomerOption | undefined;
  selectedMissingEmail: boolean;
  fieldClass: string;
}) {
  if (!manualMode && selected) {
    return (
      <div className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Příjemce: </span>
          {selected.lastName} {selected.firstName}
        </p>
        {selectedMissingEmail ? (
          <p className="text-destructive">
            Zákazník DP nemá e-mail — doplňte ho v Zákaznících DP, nebo
            zvolte ruční odeslání.
          </p>
        ) : (
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {selected.email}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm sm:col-span-1">
        <span className="text-muted-foreground">Příjmení</span>
        <input name="lastName" className={fieldClass} />
      </label>
      <label className="space-y-1 text-sm sm:col-span-1">
        <span className="text-muted-foreground">Jméno</span>
        <input name="firstName" className={fieldClass} />
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span className="text-muted-foreground">E-mail</span>
        <input name="to" type="email" required className={fieldClass} />
      </label>
    </div>
  );
}
