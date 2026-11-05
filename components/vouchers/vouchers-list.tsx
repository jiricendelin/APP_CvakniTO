"use client";

import Link from "next/link";
import { formatCzk } from "@/lib/money";
import { formatPragueDateCz } from "@/lib/time/prague-parts";
import {
  VOUCHER_KIND_LABELS,
  VOUCHER_STATUS_LABELS,
  isVoucherKind,
  isVoucherStatus,
} from "@/lib/vouchers/status";

export type VoucherListRow = {
  id: string;
  number: string;
  buyerName: string;
  recipientName: string;
  priceCents: number;
  status: string;
  kind: string;
  serviceName: string;
  validUntil: string;
  createdAt: string;
};

export function VouchersList({ rows }: { rows: VoucherListRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Zatím žádné poukazy.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Číslo</th>
            <th className="px-3 py-2 font-medium">Druh</th>
            <th className="px-3 py-2 font-medium">Kupující</th>
            <th className="px-3 py-2 font-medium">Obdarovaný</th>
            <th className="px-3 py-2 font-medium">Cena</th>
            <th className="px-3 py-2 font-medium">Platnost</th>
            <th className="px-3 py-2 font-medium">Stav</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-3 py-2">
                <Link
                  href={`/vouchers/${r.id}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {r.number}
                </Link>
              </td>
              <td className="px-3 py-2">
                {isVoucherKind(r.kind)
                  ? VOUCHER_KIND_LABELS[r.kind]
                  : r.kind}
                {r.serviceName ? (
                  <span className="block text-xs text-muted-foreground">
                    {r.serviceName}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2">{r.buyerName}</td>
              <td className="px-3 py-2">{r.recipientName}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatCzk(r.priceCents)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatPragueDateCz(new Date(r.validUntil))}
              </td>
              <td className="px-3 py-2">
                {isVoucherStatus(r.status)
                  ? VOUCHER_STATUS_LABELS[r.status]
                  : r.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
