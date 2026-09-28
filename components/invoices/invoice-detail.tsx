import Link from "next/link";
import { formatCzk } from "@/lib/money";
import {
  INVOICE_STATUS_LABELS,
  resolveInvoiceStatus,
  type InvoiceStatus,
} from "@/lib/invoices/status";
import { PRICE_CATEGORY_LABELS, isPriceCategory } from "@/lib/pricelist/categories";
import { formatPragueDate, formatPragueDateTime } from "@/lib/time/format-prague";

export type InvoiceDetailData = {
  id: string;
  number: string;
  variableSymbol: string;
  status: string;
  totalCents: number;
  issuedAt: Date;
  dueDate: Date;
  customer: {
    name: string;
    ico: string;
    dic: string;
    address: string;
    email: string;
    phone: string;
  };
  items: {
    name: string;
    quantity: number;
    priceCents: number;
    lineTotalCents: number;
    category: string;
  }[];
};

export function InvoiceDetail({ invoice }: { invoice: InvoiceDetailData }) {
  const status = resolveInvoiceStatus(invoice.status, invoice.dueDate);
  const statusLabel = INVOICE_STATUS_LABELS[status as InvoiceStatus];

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link href="/invoices" className="text-sm text-primary hover:underline">
        ← Faktury
      </Link>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Faktura {invoice.number}</h1>
        <p className="text-sm text-muted-foreground">
          Vystaveno {formatPragueDateTime(invoice.issuedAt)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Stav</dt>
        <dd>{statusLabel}</dd>
        <dt className="text-muted-foreground">Variabilní symbol</dt>
        <dd className="font-mono">{invoice.variableSymbol}</dd>
        <dt className="text-muted-foreground">Splatnost</dt>
        <dd>{formatPragueDate(invoice.dueDate)}</dd>
      </dl>

      <section className="space-y-2 rounded-lg border border-border p-4 text-sm">
        <h2 className="font-medium">Odběratel</h2>
        <p>{invoice.customer.name}</p>
        {invoice.customer.address && <p>{invoice.customer.address}</p>}
        {(invoice.customer.ico || invoice.customer.dic) && (
          <p className="text-muted-foreground">
            {invoice.customer.ico ? `IČO ${invoice.customer.ico}` : ""}
            {invoice.customer.dic ? ` · DIČ ${invoice.customer.dic}` : ""}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Položky</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {invoice.items.map((item, idx) => (
            <li key={idx} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">
                  {item.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    × {item.quantity}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPriceCategory(item.category)
                    ? PRICE_CATEGORY_LABELS[item.category]
                    : item.category}
                </p>
              </div>
              <p className="tabular-nums">{formatCzk(item.lineTotalCents)}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-right text-2xl font-bold tabular-nums text-primary">
        {formatCzk(invoice.totalCents)}
      </p>

      <a
        href={`/api/invoices/${invoice.id}/pdf`}
        className="inline-flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground sm:w-auto"
      >
        Stáhnout PDF
      </a>
    </div>
  );
}
