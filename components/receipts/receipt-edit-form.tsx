"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateReceiptItemsAction,
  type ReceiptActionState,
} from "@/app/(app)/receipts/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk } from "@/lib/money";
import { PRICE_CATEGORY_LABELS, isPriceCategory } from "@/lib/pricelist/categories";

export type ReceiptEditItem = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  category: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : "Uložit změny"}
    </button>
  );
}

export function ReceiptEditForm({
  csrf,
  receiptId,
  number,
  items,
}: {
  csrf: string;
  receiptId: string;
  number: string;
  items: ReceiptEditItem[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    ReceiptActionState,
    FormData
  >(updateReceiptItemsAction, {});

  useEffect(() => {
    if (state.success) router.push(`/receipts/${receiptId}`);
  }, [state.success, router, receiptId]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <Link
          href={`/receipts/${receiptId}`}
          className="text-sm text-primary hover:underline"
        >
          ← Detail účtenky
        </Link>
        <h1 className="text-xl font-semibold">Upravit {number}</h1>
        <p className="text-sm text-muted-foreground">
          Změň množství. Nulu u položky = odebrat z účtenky.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <CsrfField token={csrf} />
        <input type="hidden" name="receiptId" value={receiptId} />
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCzk(item.priceCents)} ·{" "}
                {isPriceCategory(item.category)
                  ? PRICE_CATEGORY_LABELS[item.category]
                  : item.category}
              </p>
              <label className="mt-2 block text-xs">
                Množství
                <input
                  type="number"
                  name={`qty_${item.id}`}
                  min={0}
                  max={999}
                  defaultValue={item.quantity}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </li>
          ))}
        </ul>
        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>
    </div>
  );
}
