import Link from "next/link";
import { formatCzk } from "@/lib/money";
import { PRICE_CATEGORY_LABELS, isPriceCategory } from "@/lib/pricelist/categories";
import {
  PAYMENT_TYPE_LABELS,
  isPaymentType,
} from "@/lib/receipts/payment-type";
import { formatPragueDateTime } from "@/lib/time/format-prague";
import { ReceiptDeleteButton } from "./receipt-delete-button";
import { PaymentQrSection } from "./payment-qr-section";
import { ReceiptPrintButton } from "./receipt-print-button";
import type { ReceiptPrintPayload } from "@/lib/receipt-template/render-print";

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

function eetLabel(status: string): string {
  if (status === "neodeslano") return "Neodesláno do EET";
  return status;
}

export function ReceiptDetail({
  receipt,
  canModify,
  csrf,
  qrSpayd,
  qrMissingIban,
  printPayload,
}: {
  receipt: ReceiptDetailData;
  canModify: boolean;
  csrf: string;
  qrSpayd?: string | null;
  qrMissingIban?: boolean;
  printPayload?: ReceiptPrintPayload | null;
}) {
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
        <PaymentQrSection
          spayd={qrSpayd ?? null}
          totalCents={receipt.totalCents}
          variableSymbol={receipt.variableSymbol}
          missingIban={qrMissingIban}
        />
      )}

      <ReceiptPrintButton printPayload={printPayload ?? null} />

      {canModify && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href={`/receipts/${receipt.id}/edit`}
            className="inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Upravit
          </Link>
          <ReceiptDeleteButton csrf={csrf} receiptId={receipt.id} />
        </div>
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
