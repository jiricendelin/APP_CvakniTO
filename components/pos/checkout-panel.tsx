"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  checkoutAction,
  type CheckoutState,
} from "@/app/(app)/checkout/actions";
import { CsrfField } from "@/components/csrf-field";
import { PaymentQrSection } from "@/components/receipts/payment-qr-section";
import { serializeCartForCheckout } from "@/lib/pos/serialize-cart";
import { cartTotal, type CartLine } from "@/lib/pos/types";

const PRINT_STORAGE_KEY = "cvaknito.printOnCheckout";

function PayButton({
  label,
  paymentType,
}: {
  label: string;
  paymentType: "hotove" | "qr";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="paymentType"
      value={paymentType}
      disabled={pending}
      className="min-h-[3.5rem] flex-1 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : label}
    </button>
  );
}

export function CheckoutPanel({
  csrf,
  cart,
  printOnIssue,
  onPrintChange,
  onCheckoutSuccess,
}: {
  csrf: string;
  cart: CartLine[];
  printOnIssue: boolean;
  onPrintChange: (value: boolean) => void;
  onCheckoutSuccess: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    checkoutAction,
    {}
  );

  const qrPending =
    Boolean(state.receiptId) &&
    (state.qrSpayd !== undefined || state.qrMissingIban);

  useEffect(() => {
    if (!state.receiptId || qrPending) return;
    onCheckoutSuccess();
    router.push(`/receipts/${state.receiptId}`);
  }, [state.receiptId, qrPending, router, onCheckoutSuccess]);

  function finishQrFlow() {
    if (!state.receiptId) return;
    onCheckoutSuccess();
    router.push(`/receipts/${state.receiptId}`);
  }

  if (cart.length === 0) return null;

  const totalCents = cartTotal(cart);

  if (qrPending && state.receiptId) {
    return (
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <PaymentQrSection
          spayd={state.qrSpayd ?? null}
          totalCents={state.qrTotalCents ?? totalCents}
          variableSymbol={state.qrVariableSymbol ?? ""}
          missingIban={state.qrMissingIban}
        />
        <button
          type="button"
          onClick={finishQrFlow}
          className="min-h-[3rem] w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground"
        >
          Hotovo — detail účtenky
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-medium">Platba</h2>
      <form action={formAction} className="space-y-3">
        <CsrfField token={csrf} />
        <input
          type="hidden"
          name="cart"
          value={JSON.stringify(serializeCartForCheckout(cart))}
          readOnly
        />
        <input
          type="hidden"
          name="printOnIssue"
          value={printOnIssue ? "true" : "false"}
          readOnly
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={printOnIssue}
            onChange={(e) => {
              onPrintChange(e.target.checked);
              try {
                localStorage.setItem(
                  PRINT_STORAGE_KEY,
                  e.target.checked ? "1" : "0"
                );
              } catch {
                /* ignore */
              }
            }}
            className="h-4 w-4 rounded border-input"
          />
          Tisknout účtenku
        </label>
        <div className="flex gap-2">
          <PayButton label="Hotově" paymentType="hotove" />
          <PayButton label="QR" paymentType="qr" />
        </div>
        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </section>
  );
}

export function loadPrintOnIssuePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PRINT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
