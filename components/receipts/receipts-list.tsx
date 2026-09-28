import Link from "next/link";
import { formatCzk } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
} from "@/lib/pricelist/categories";
import {
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
} from "@/lib/receipts/payment-type";
import type { ReceiptListFilters } from "@/lib/receipts/list-filters";
import { formatPragueDateTime } from "@/lib/time/format-prague";
import { isPaymentType } from "@/lib/receipts/payment-type";

export type ReceiptListRow = {
  id: string;
  number: string;
  paymentType: string;
  totalCents: number;
  eetStatus: string;
  createdAt: Date;
};

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function ReceiptsList({
  receipts,
  filters,
}: {
  receipts: ReceiptListRow[];
  filters: ReceiptListFilters;
}) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Účtenky</h1>
        <p className="text-sm text-muted-foreground">
          Filtruj podle data, kategorie položky nebo typu platby.
        </p>
      </div>

      <form method="get" className="space-y-3 rounded-lg border border-border p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs">
            Datum od
            <input
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom ?? ""}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="text-xs">
            Datum do
            <input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo ?? ""}
              className={`${fieldClass} mt-1`}
            />
          </label>
        </div>
        <label className="block text-xs">
          Kategorie (účtenka obsahuje položku)
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Všechny</option>
            {PRICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {PRICE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Typ platby
          <select
            name="paymentType"
            defaultValue={filters.paymentType ?? ""}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Všechny</option>
            {PAYMENT_TYPES.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_TYPE_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Filtrovat
          </button>
          <Link
            href="/receipts"
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            Zrušit filtry
          </Link>
        </div>
      </form>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {receipts.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">
            Žádné účtenky nevyhovují filtru.
          </li>
        ) : (
          receipts.map((r) => (
            <li key={r.id}>
              <Link
                href={`/receipts/${r.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{r.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPragueDateTime(r.createdAt)}
                    {" · "}
                    {isPaymentType(r.paymentType)
                      ? PAYMENT_TYPE_LABELS[r.paymentType]
                      : r.paymentType}
                    {r.eetStatus !== "neodeslano" ? " · EET odesláno" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCzk(r.totalCents)}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
