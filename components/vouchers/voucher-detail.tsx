"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  extendVoucherAction,
  sendVoucherEmailAction,
  updateVoucherFieldsAction,
  updateVoucherStatusAction,
  type VoucherActionState,
} from "@/app/(app)/vouchers/actions";
import {
  assignPaymentAction,
  type AssignPaymentState,
} from "@/app/(app)/payments/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk } from "@/lib/money";
import { formatPragueDateCz } from "@/lib/time/prague-parts";
import { formatPragueDateTime } from "@/lib/time/format-prague";
import {
  VOUCHER_KIND_LABELS,
  VOUCHER_STATUS_LABELS,
  VOUCHER_STATUSES,
  isVoucherKind,
  isVoucherStatus,
} from "@/lib/vouchers/status";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export type VoucherDetailData = {
  id: string;
  number: string;
  buyerName: string;
  recipientName: string;
  buyerEmail: string;
  priceCents: number;
  status: string;
  kind: string;
  serviceName: string;
  validUntil: string;
  note: string;
  receipt: {
    id: string;
    number: string;
    variableSymbol: string;
    paidAt: string | null;
  } | null;
};

export type UnmatchedPaymentOption = {
  id: string;
  amountCents: number;
  variableSymbol: string;
  message: string;
  createdAt: string;
};

export type GiftCustomerOption = {
  id: string;
  firstName: string;
  lastName: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

function ActionResult({ state }: { state: VoucherActionState }) {
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state.success) return <p className="text-sm text-green-700">{state.success}</p>;
  return null;
}

function MarkPaidForm({
  csrf,
  receiptId,
  unmatchedPayments,
}: {
  csrf: string;
  receiptId: string;
  unmatchedPayments: UnmatchedPaymentOption[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    AssignPaymentState,
    FormData
  >(assignPaymentAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  if (unmatchedPayments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Žádné nespárované platby k přiřazení.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <CsrfField token={csrf} />
      <input type="hidden" name="receiptId" value={receiptId} />
      <label className="min-w-[16rem] flex-1 space-y-1 text-sm">
        <span>Platba z banky</span>
        <select
          name="paymentId"
          required
          className={fieldClass}
          defaultValue=""
        >
          <option value="" disabled>
            Vyberte platbu…
          </option>
          {unmatchedPayments.map((p) => (
            <option key={p.id} value={p.id}>
              {formatPragueDateTime(new Date(p.createdAt))} ·{" "}
              {formatCzk(p.amountCents)} · VS {p.variableSymbol}
              {p.message ? ` · ${p.message}` : ""}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton label="Označit jako zaplacený" />
      {state.error ? (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="w-full text-sm text-green-700">{state.success}</p>
      ) : null}
    </form>
  );
}

export function VoucherDetail({
  csrf,
  voucher,
  giftCustomers = [],
  unmatchedPayments = [],
}: {
  csrf: string;
  voucher: VoucherDetailData;
  giftCustomers?: GiftCustomerOption[];
  unmatchedPayments?: UnmatchedPaymentOption[];
}) {
  const router = useRouter();
  const [recipientName, setRecipientName] = useState(voucher.recipientName);
  const [recipientGiftCustomerId, setRecipientGiftCustomerId] = useState("");
  useEffect(() => {
    setRecipientName(voucher.recipientName);
  }, [voucher.recipientName]);
  const [statusState, statusAction] = useActionState(updateVoucherStatusAction, {});
  const [extendState, extendAction] = useActionState(extendVoucherAction, {});
  const [mailState, mailAction] = useActionState(sendVoucherEmailAction, {});
  const [fieldsState, fieldsAction] = useActionState(updateVoucherFieldsAction, {});

  useEffect(() => {
    if (
      statusState.success ||
      extendState.success ||
      mailState.success ||
      fieldsState.success
    ) {
      router.refresh();
    }
  }, [
    statusState.success,
    extendState.success,
    mailState.success,
    fieldsState.success,
    router,
  ]);

  const selectableStatuses = VOUCHER_STATUSES.filter(
    (s) => s !== "zaplaceny" || voucher.status === "zaplaceny"
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4 space-y-2">
        <h2 className="text-lg font-semibold">Poukaz {voucher.number}</h2>
        <p className="text-sm text-muted-foreground">
          {isVoucherKind(voucher.kind)
            ? VOUCHER_KIND_LABELS[voucher.kind]
            : voucher.kind}
          {voucher.serviceName ? ` — ${voucher.serviceName}` : ""}
        </p>
        <p>
          Cena: <strong>{formatCzk(voucher.priceCents)}</strong>
        </p>
        <p>
          Platnost do:{" "}
          <strong>{formatPragueDateCz(new Date(voucher.validUntil))}</strong>
        </p>
        <p>
          Stav:{" "}
          <strong>
            {isVoucherStatus(voucher.status)
              ? VOUCHER_STATUS_LABELS[voucher.status]
              : voucher.status}
          </strong>
        </p>
        {voucher.receipt ? (
          <p className="text-sm">
            Účtenka:{" "}
            <Link
              href={`/receipts/${voucher.receipt.id}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {voucher.receipt.number}
            </Link>{" "}
            (VS {voucher.receipt.variableSymbol}
            {voucher.receipt.paidAt ? ", zaplaceno" : ", neuhrazeno"})
          </p>
        ) : null}
      </div>

      {voucher.status === "vystaveny" &&
        voucher.receipt &&
        voucher.receipt.paidAt === null && (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="font-medium text-sm">Označit jako zaplacený</p>
            <MarkPaidForm
              csrf={csrf}
              receiptId={voucher.receipt.id}
              unmatchedPayments={unmatchedPayments}
            />
          </div>
        )}

      <form action={fieldsAction} className="space-y-3 rounded-lg border border-border p-4">
        <CsrfField token={csrf} />
        <input type="hidden" name="id" value={voucher.id} />
        <p className="font-medium text-sm">Údaje</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Kupující</span>
            <input
              name="buyerName"
              defaultValue={voucher.buyerName}
              required
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Obdarovaný (volitelné)</span>
            <input
              name="recipientName"
              value={recipientName}
              onChange={(e) => {
                setRecipientGiftCustomerId("");
                setRecipientName(e.target.value);
              }}
              className={fieldClass}
            />
          </label>
        </div>
        {giftCustomers.length > 0 ? (
          <label className="space-y-1 text-sm block">
            <span>Nebo vybrat ze zákazníků DP</span>
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
        ) : null}
        <label className="space-y-1 text-sm block">
          <span>E-mail</span>
          <input
            name="buyerEmail"
            type="email"
            defaultValue={voucher.buyerEmail}
            className={fieldClass}
          />
        </label>
        <label className="space-y-1 text-sm block">
          <span>Poznámka</span>
          <textarea
            name="note"
            rows={2}
            defaultValue={voucher.note}
            className={fieldClass}
          />
        </label>
        <SubmitButton label="Uložit údaje" />
        <ActionResult state={fieldsState} />
      </form>

      <form action={statusAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <CsrfField token={csrf} />
        <input type="hidden" name="id" value={voucher.id} />
        <label className="space-y-1 text-sm">
          <span>Změnit stav</span>
          <select
            name="status"
            defaultValue={voucher.status}
            className={fieldClass}
          >
            {selectableStatuses.map((s) => (
              <option key={s} value={s}>
                {VOUCHER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton label="Uložit stav" />
        <ActionResult state={statusState} />
      </form>

      <form action={extendAction} className="space-y-3 rounded-lg border border-border p-4">
        <CsrfField token={csrf} />
        <input type="hidden" name="id" value={voucher.id} />
        <p className="font-medium text-sm">Prodloužit platnost</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Přidat měsíce</span>
            <input
              name="months"
              type="number"
              min={1}
              max={36}
              defaultValue={6}
              className={fieldClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Nebo konkrétní datum</span>
            <input name="validUntil" type="date" className={fieldClass} />
          </label>
        </div>
        <SubmitButton label="Prodloužit" />
        <ActionResult state={extendState} />
      </form>

      <form action={mailAction} className="space-y-3 rounded-lg border border-border p-4">
        <CsrfField token={csrf} />
        <input type="hidden" name="id" value={voucher.id} />
        <p className="font-medium text-sm">Odeslat e-mail s poukazem</p>
        <label className="space-y-1 text-sm block">
          <span>E-mail (prázdné = e-mail kupujícího)</span>
          <input
            name="to"
            type="email"
            defaultValue={voucher.buyerEmail}
            className={fieldClass}
          />
        </label>
        <SubmitButton label="Odeslat" />
        <ActionResult state={mailState} />
      </form>
    </div>
  );
}
