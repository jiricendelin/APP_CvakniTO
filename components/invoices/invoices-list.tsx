import Link from "next/link";
import { formatCzk } from "@/lib/money";
import {
  INVOICE_STATUS_LABELS,
  resolveInvoiceStatus,
  type InvoiceStatus,
} from "@/lib/invoices/status";
import { formatPragueDate } from "@/lib/time/format-prague";

export type InvoiceListRow = {
  id: string;
  number: string;
  totalCents: number;
  status: string;
  dueDate: Date;
  issuedAt: Date;
  customerName: string;
};

export function InvoicesList({ invoices }: { invoices: InvoiceListRow[] }) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Faktury</h1>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Nová faktura
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Zatím žádné faktury. Vytvořte první fakturu pro zákazníka.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {invoices.map((inv) => {
            const status = resolveInvoiceStatus(inv.status, inv.dueDate);
            const statusLabel = INVOICE_STATUS_LABELS[status as InvoiceStatus];
            return (
              <li key={inv.id}>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{inv.number}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {inv.customerName} · splatnost{" "}
                      {formatPragueDate(inv.dueDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">{statusLabel}</p>
                  </div>
                  <p className="shrink-0 tabular-nums font-medium">
                    {formatCzk(inv.totalCents)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
