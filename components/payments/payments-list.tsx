import Link from "next/link";
import { formatCzk } from "@/lib/money";
import { formatPragueDateTime } from "@/lib/time/format-prague";

export type PaymentRow = {
  id: string;
  moveId: string;
  variableSymbol: string;
  amountCents: number;
  matched: boolean;
  message: string;
  createdAt: Date;
  receiptId: string | null;
  receiptNumber: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
};

export function PaymentsList({ payments }: { payments: PaymentRow[] }) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Platby z banky</h1>
      <p className="text-sm text-muted-foreground">
        Párování podle VS z webhooku n8n. Nespárované platby zůstávají v seznamu.
      </p>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Zatím žádné platby.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {payments.map((p) => (
            <li key={p.id} className="space-y-1 px-4 py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium tabular-nums">
                  {formatCzk(p.amountCents)}
                </span>
                <span
                  className={
                    p.matched ? "text-primary" : "text-amber-800"
                  }
                >
                  {p.matched ? "Spárováno" : "Nespárováno"}
                </span>
              </div>
              <p className="text-muted-foreground">
                VS {p.variableSymbol} · move {p.moveId}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPragueDateTime(p.createdAt)}
              </p>
              {p.invoiceId && p.invoiceNumber && (
                <Link
                  href={`/invoices/${p.invoiceId}`}
                  className="text-xs text-primary hover:underline"
                >
                  Faktura {p.invoiceNumber}
                </Link>
              )}
              {p.receiptId && p.receiptNumber && (
                <Link
                  href={`/receipts/${p.receiptId}`}
                  className="text-xs text-primary hover:underline"
                >
                  Účtenka {p.receiptNumber}
                </Link>
              )}
              {p.message && (
                <p className="text-xs text-muted-foreground">{p.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
