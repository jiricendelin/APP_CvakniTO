import { prisma } from "@/lib/prisma";
import {
  PRICE_CATEGORIES,
  type PriceCategory,
} from "@/lib/pricelist/categories";
import {
  parseReceiptListFilters,
  type ReceiptListFilters,
} from "@/lib/receipts/list-filters";
import {
  pragueEndExclusiveUtc,
  pragueStartOfDayUtc,
} from "@/lib/time/prague";

export type CategoryTotals = Record<PriceCategory, number>;

export type ReportSummary = {
  filters: ReceiptListFilters;
  receiptTotals: CategoryTotals;
  invoiceTotals: CategoryTotals;
  grandTotalCents: number;
};

function emptyTotals(): CategoryTotals {
  return {
    masaze: 0,
    pedikura: 0,
    ostatni: 0,
  };
}

function receiptWhere(tenantId: string, filters: ReceiptListFilters) {
  const createdAt: { gte?: Date; lt?: Date } = {};
  if (filters.dateFrom) {
    const from = pragueStartOfDayUtc(filters.dateFrom);
    if (from) createdAt.gte = from;
  }
  if (filters.dateTo) {
    const to = pragueEndExclusiveUtc(filters.dateTo);
    if (to) createdAt.lt = to;
  }

  return {
    tenantId,
    ...(filters.paymentType ? { paymentType: filters.paymentType } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
    ...(filters.category
      ? { items: { some: { category: filters.category } } }
      : {}),
  };
}

export async function buildReportSummary(
  tenantId: string,
  searchParams: Record<string, string | string[] | undefined>
): Promise<ReportSummary> {
  const filters = parseReceiptListFilters(searchParams);
  const receiptTotals = emptyTotals();
  const invoiceTotals = emptyTotals();

  const receiptItems = await prisma.receiptItem.findMany({
    where: {
      tenantId,
      receipt: receiptWhere(tenantId, filters),
      ...(filters.category ? { category: filters.category } : {}),
    },
    select: { category: true, lineTotalCents: true },
  });

  for (const item of receiptItems) {
    if (!PRICE_CATEGORIES.includes(item.category as PriceCategory)) continue;
    const cat = item.category as PriceCategory;
    receiptTotals[cat] += item.lineTotalCents;
  }

  const invoiceCreatedAt: { gte?: Date; lt?: Date } = {};
  if (filters.dateFrom) {
    const from = pragueStartOfDayUtc(filters.dateFrom);
    if (from) invoiceCreatedAt.gte = from;
  }
  if (filters.dateTo) {
    const to = pragueEndExclusiveUtc(filters.dateTo);
    if (to) invoiceCreatedAt.lt = to;
  }

  const invoiceItems = await prisma.invoiceItem.findMany({
    where: {
      tenantId,
      category: filters.category ?? undefined,
      invoice: {
        tenantId,
        status: "zaplacena",
        ...(Object.keys(invoiceCreatedAt).length
          ? { issuedAt: invoiceCreatedAt }
          : {}),
      },
    },
    select: { category: true, lineTotalCents: true },
  });

  for (const item of invoiceItems) {
    if (!PRICE_CATEGORIES.includes(item.category as PriceCategory)) continue;
    const cat = item.category as PriceCategory;
    invoiceTotals[cat] += item.lineTotalCents;
  }

  const grandTotalCents =
    PRICE_CATEGORIES.reduce(
      (s, c) => s + receiptTotals[c] + invoiceTotals[c],
      0
    );

  return { filters, receiptTotals, invoiceTotals, grandTotalCents };
}
