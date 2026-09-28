import Link from "next/link";
import { formatCzk } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
} from "@/lib/pricelist/categories";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from "@/lib/receipts/payment-type";
import type { ReportSummary } from "@/lib/reports/aggregate";

function buildExportQuery(filters: ReportSummary["filters"]): string {
  const q = new URLSearchParams();
  if (filters.dateFrom) q.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) q.set("dateTo", filters.dateTo);
  if (filters.category) q.set("category", filters.category);
  if (filters.paymentType) q.set("paymentType", filters.paymentType);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function ReportsView({ summary }: { summary: ReportSummary }) {
  const { filters } = summary;
  const exportQuery = buildExportQuery(filters);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">Přehledy</h1>
      <p className="text-sm text-muted-foreground">
        Součty po kategoriích z účtenek a zaplacených faktur (pro paušál).
      </p>

      <form method="get" className="space-y-3 rounded-lg border border-border p-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            Od
            <input
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom ?? ""}
              className="mt-1 w-full rounded-md border border-input px-2 py-2 text-sm"
            />
          </label>
          <label className="text-xs">
            Do
            <input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo ?? ""}
              className="mt-1 w-full rounded-md border border-input px-2 py-2 text-sm"
            />
          </label>
        </div>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="w-full rounded-md border border-input px-2 py-2 text-sm"
        >
          <option value="">Všechny kategorie</option>
          {PRICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PRICE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          name="paymentType"
          defaultValue={filters.paymentType ?? ""}
          className="w-full rounded-md border border-input px-2 py-2 text-sm"
        >
          <option value="">Všechny typy platby (účtenky)</option>
          {PAYMENT_TYPES.map((p) => (
            <option key={p} value={p}>
              {PAYMENT_TYPE_LABELS[p]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Filtrovat
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Účtenky</h2>
        <ul className="text-sm">
          {PRICE_CATEGORIES.map((cat) => (
            <li key={cat} className="flex justify-between py-1">
              <span>{PRICE_CATEGORY_LABELS[cat]}</span>
              <span className="tabular-nums">
                {formatCzk(summary.receiptTotals[cat])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Zaplacené faktury</h2>
        <ul className="text-sm">
          {PRICE_CATEGORIES.map((cat) => (
            <li key={cat} className="flex justify-between py-1">
              <span>{PRICE_CATEGORY_LABELS[cat]}</span>
              <span className="tabular-nums">
                {formatCzk(summary.invoiceTotals[cat])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-right text-lg font-semibold tabular-nums text-primary">
        Celkem {formatCzk(summary.grandTotalCents)}
      </p>

      <Link
        href={`/api/reports/export${exportQuery}`}
        className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Export CSV
      </Link>
    </div>
  );
}
