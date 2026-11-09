"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  createVoucherAction,
  type VoucherActionState,
} from "@/app/(app)/vouchers/actions";
import { CsrfField } from "@/components/csrf-field";
import { VOUCHER_KIND_LABELS } from "@/lib/vouchers/status";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type PriceItemOption = {
  id: string;
  name: string;
  priceCents: number;
};

type GiftCustomerOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Vystavuji…" : "Vystavit poukaz"}
    </button>
  );
}

export function VoucherCreateForm({
  csrf,
  priceItems,
  giftCustomers,
}: {
  csrf: string;
  priceItems: PriceItemOption[];
  giftCustomers: GiftCustomerOption[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"service" | "value">("service");
  const [priceItemId, setPriceItemId] = useState(priceItems[0]?.id ?? "");
  const [recipientName, setRecipientName] = useState("");
  const [recipientGiftCustomerId, setRecipientGiftCustomerId] = useState("");
  const [state, formAction] = useActionState<VoucherActionState, FormData>(
    createVoucherAction,
    {}
  );

  useEffect(() => {
    if (state.voucherId) {
      router.push(`/vouchers/${state.voucherId}`);
      router.refresh();
    }
  }, [state.voucherId, router]);

  const selected = priceItems.find((p) => p.id === priceItemId);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <CsrfField token={csrf} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Druh</span>
          <select
            name="kind"
            className={fieldClass}
            value={kind}
            onChange={(e) =>
              setKind(e.target.value === "value" ? "value" : "service")
            }
          >
            <option value="service">{VOUCHER_KIND_LABELS.service}</option>
            <option value="value">{VOUCHER_KIND_LABELS.value}</option>
          </select>
        </label>

        {kind === "service" ? (
          <label className="space-y-1 text-sm">
            <span>Služba</span>
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
            {selected ? (
              <input type="hidden" name="price" value={(selected.priceCents / 100).toFixed(2).replace(".", ",")} />
            ) : null}
          </label>
        ) : (
          <label className="space-y-1 text-sm">
            <span>Hodnota (Kč)</span>
            <input name="price" required className={fieldClass} placeholder="1000" />
          </label>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Kupující</span>
          <input name="buyerName" required className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Obdarovaný (volitelné — doplníte později)</span>
          <input
            name="recipientName"
            className={fieldClass}
            value={recipientName}
            onChange={(e) => {
              setRecipientGiftCustomerId("");
              setRecipientName(e.target.value);
            }}
          />
        </label>
      </div>

      <label className="space-y-1 text-sm block">
        <span>Nebo vybrat obdarovaného ze zákazníků DP</span>
        <select
          name="recipientGiftCustomerId"
          className={fieldClass}
          value={recipientGiftCustomerId}
          onChange={(e) => {
            const id = e.target.value;
            setRecipientGiftCustomerId(id);
            const c = giftCustomers.find((g) => g.id === id);
            if (c) {
              setRecipientName(`${c.lastName} ${c.firstName}`.trim());
            }
          }}
        >
          <option value="">— nevybráno —</option>
          {giftCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.lastName} {c.firstName}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>E-mail kupujícího</span>
          <input name="buyerEmail" type="email" className={fieldClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Zákazník DP (volitelné)</span>
          <select name="giftCustomerId" className={fieldClass} defaultValue="">
            <option value="">—</option>
            {giftCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName} {c.firstName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1 text-sm block">
        <span>Poznámka</span>
        <textarea name="note" rows={2} className={fieldClass} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sendEmail" value="true" defaultChecked />
        Odeslat e-mail s poukazem a účtenkou
      </label>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success && !state.voucherId ? (
        <p className="text-sm text-green-700">{state.success}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
