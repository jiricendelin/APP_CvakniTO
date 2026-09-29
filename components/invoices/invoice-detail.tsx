import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceHeaderCard } from "@/components/invoices/invoice-header-card";
import { ItemsCard } from "@/components/invoices/items-card";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { formatCzk } from "@/lib/money";
import {
  RESOLVED_STATUS_LABELS,
  RESOLVED_STATUS_VARIANTS,
  resolveInvoiceStatus,
} from "@/lib/invoices/status";
import { formatPragueDate, formatPragueDateTime } from "@/lib/time/format-prague";

export type InvoiceDetailData = {
  id: string;
  number: string;
  variableSymbol: string;
  status: string;
  totalCents: number;
  issuedAt: Date;
  dueDate: Date;
  sentAt: Date | null;
  paidAt: Date | null;
  customer: {
    id: string;
    name: string;
    ico: string;
    dic: string;
    address: string;
    email: string;
    phone: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    priceCents: number;
    category: string;
  }[];
  payments: {
    id: string;
    amountCents: number;
    bookedAt: Date | null;
    message: string;
  }[];
};

export function InvoiceDetail({
  invoice,
  csrf,
  customers,
  sendSlot,
}: {
  invoice: InvoiceDetailData;
  csrf: string;
  customers: { id: string; name: string }[];
  sendSlot?: React.ReactNode;
}) {
  const status = resolveInvoiceStatus(invoice.status, invoice.dueDate);
  const statusLabel = RESOLVED_STATUS_LABELS[status];
  const editable = invoice.status === "koncept";
  const paidTotal = invoice.payments.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div>
      <Link
        href="/invoices"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět na faktury
      </Link>

      <PageHeader
        title={`Faktura ${invoice.number}`}
        actions={
          <InvoiceActions csrf={csrf} invoice={invoice} sendSlot={sendSlot} />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={RESOLVED_STATUS_VARIANTS[status]}>{statusLabel}</Badge>
        <span className="text-sm text-muted-foreground">
          VS {invoice.variableSymbol}
        </span>
        {invoice.status !== "koncept" && (
          <span className="text-sm text-muted-foreground">
            Vystaveno {formatPragueDateTime(invoice.issuedAt)}
          </span>
        )}
        {invoice.sentAt && (
          <span className="text-sm text-muted-foreground">
            Odesláno {formatPragueDateTime(invoice.sentAt)}
          </span>
        )}
        {invoice.paidAt && (
          <span className="text-sm text-muted-foreground">
            Uhrazeno {formatPragueDate(invoice.paidAt)}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <InvoiceHeaderCard
            csrf={csrf}
            invoiceId={invoice.id}
            dueDate={invoice.dueDate}
            customer={invoice.customer}
            customers={customers}
            editable={editable}
          />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <ItemsCard
            csrf={csrf}
            invoiceId={invoice.id}
            items={invoice.items}
            totalCents={invoice.totalCents}
            editable={editable}
          />

          <Card className="bg-background">
            <CardHeader>
              <CardTitle>
                Platby ({formatCzk(paidTotal)} z {formatCzk(invoice.totalCents)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Zatím nebyla spárována žádná platba.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {invoice.payments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        {p.bookedAt ? formatPragueDate(p.bookedAt) : "—"}
                        {p.message ? ` · ${p.message}` : ""}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatCzk(p.amountCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
