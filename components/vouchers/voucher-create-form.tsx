"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CsrfField } from "@/components/csrf-field";
import {
  PersonPickFields,
  type PersonPickCustomer,
} from "@/components/gift-customers/person-pick-fields";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const sectionClass =
  "space-y-3 rounded-lg border border-border bg-muted/50 p-4";

type PriceItemOption = {
  id: string;
  name: string;
  priceCents: number;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={sectionClass}>
      <legend className="px-1 text-sm font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

export function VoucherCreateForm({
  csrf,
  priceItems,
  giftCustomers,
}: {
  csrf: string;
  priceItems: PriceItemOption[];
  giftCustomers: PersonPickCustomer[];
}) {
  const router = useRouter();
  const [priceItemId, setPriceItemId] = useState(priceItems[0]?.id ?? "");
  const [sendEmail, setSendEmail] = useState(true);
  const [buyerMissingEmail, setBuyerMissingEmail] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const submitDisabled =
    pending || (sendEmail && buyerMissingEmail);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = (await res.json()) as {
        error?: string;
        success?: string;
        voucherId?: string;
      };
      if (data.error && !data.voucherId) {
        setError(data.error);
        return;
      }
      if (data.error) {
        setError(data.error);
      }
      if (data.voucherId) {
        router.push(`/vouchers/${data.voucherId}`);
        router.refresh();
        return;
      }
      setSuccess(data.success);
    } catch {
      setError("Poukaz se nepodařilo vystavit.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <CsrfField token={csrf} />

      <Section title="Poukaz">
        <label className="block space-y-1 text-sm">
          <span>Položka ceníku</span>
          <select
            name="priceItemId"
            className={fieldClass}
            value={priceItemId}
            onChange={(e) => setPriceItemId(e.target.value)}
            required
          >
            {priceItems.length === 0 ? (
              <option value="">Žádná položka s povoleným poukazem</option>
            ) : (
              priceItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({(p.priceCents / 100).toFixed(0)} Kč)
                </option>
              ))
            )}
          </select>
        </label>
      </Section>

      <Section title="Kupující">
        <PersonPickFields
          namePrefix="buyer"
          customers={giftCustomers}
          fieldClass={fieldClass}
          requireName
          emailRequired={sendEmail}
          onMissingEmailChange={setBuyerMissingEmail}
        />
      </Section>

      <Section title="Obdarovaný">
        <PersonPickFields
          namePrefix="recipient"
          customers={giftCustomers}
          fieldClass={fieldClass}
        />
      </Section>

      <Section title="Poznámka">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Poznámka k poukazu</span>
          <textarea name="note" rows={2} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sendEmail"
            value="true"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Odeslat e-mail s poukazem a účtenkou
        </label>
      </Section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Vystavuji…" : "Vystavit poukaz"}
      </button>
    </form>
  );
}
