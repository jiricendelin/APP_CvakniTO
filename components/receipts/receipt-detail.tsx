import Link from "next/link";
import { formatCzk } from "@/lib/money";
import { PRICE_CATEGORY_LABELS, isPriceCategory } from "@/lib/pricelist/categories";
import {
  PAYMENT_TYPE_LABELS,
  isPaymentType,
} from "@/lib/receipts/payment-type";

export type ReceiptDetailData = {
  id: string;
  number: string;
  variableSymbol: string;
  paymentType: string;
  totalCents: number;
  eetStatus: string;
  printOnIssue: boolean;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    priceCents: number;
    quantity: number;
    category: string;
    lineTotalCents: number;
  }[];
};

function formatPragueDateTime(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function eetLabel(status: string): string {
  if (status === "neodeslano") return "Neodesláno do EET";
  return status;
}

export function ReceiptDetail({ receipt }: { receipt: ReceiptDetailData }) {
  const paymentLabel = isPaymentType(receipt.paymentType)
    ? PAYMENT_TYPE_LABELS[receipt.paymentType]
    : receipt.paymentType;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Pokladna
        </Link>
        <h1 className="text-xl font-semibold">Účtenka {receipt.number}</h1>
        <p className="text-sm text-muted-foreground">
          {formatPragueDateTime(receipt.createdAt)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Variabilní symbol</dt>
        <dd className="font-mono font-medium">{receipt.variableSymbol}</dd>
        <dt className="text-muted-foreground">Platba</dt>
        <dd>{paymentLabel}</dd>
        <dt className="text-muted-foreground">EET</dt>
        <dd>{eetLabel(receipt.eetStatus)}</dd>
        <dt className="text-muted-foreground">Tisk</dt>
        <dd>{receipt.printOnIssue ? "Požadován při vystavení" : "Ne"}</dd>
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Položky</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {receipt.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">
                  {item.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    × {item.quantity}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCzk(item.priceCents)} ·{" "}
                  {isPriceCategory(item.category)
                    ? PRICE_CATEGORY_LABELS[item.category]
                    : item.category}
                </p>
              </div>
              <p className="shrink-0 tabular-nums">{formatCzk(item.lineTotalCents)}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-right text-2xl font-bold tabular-nums text-primary">
        {formatCzk(receipt.totalCents)}
      </p>

      {receipt.paymentType === "qr" && (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          QR kód pro platbu doplníme v R12 (SPAYD).
        </p>
      )}

      <Link
        href="/receipts"
        className="block text-center text-sm text-primary hover:underline"
      >
        Seznam účtenek
      </Link>
    </div>
  );
}
