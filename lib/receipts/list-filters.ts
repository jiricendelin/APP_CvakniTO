import type { Prisma } from "@prisma/client";
import {
  isPriceCategory,
  type PriceCategory,
} from "@/lib/pricelist/categories";
import { isPaymentType, type PaymentType } from "./payment-type";
import {
  pragueEndExclusiveUtc,
  pragueStartOfDayUtc,
} from "@/lib/time/prague";

export type ReceiptListFilters = {
  dateFrom?: string;
  dateTo?: string;
  category?: PriceCategory;
  paymentType?: PaymentType;
};

export function parseReceiptListFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReceiptListFilters {
  const pick = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v.trim() : "";
  };

  const filters: ReceiptListFilters = {};
  const dateFrom = pick("dateFrom");
  const dateTo = pick("dateTo");
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const category = pick("category");
  if (category && isPriceCategory(category)) filters.category = category;

  const paymentType = pick("paymentType");
  if (paymentType && isPaymentType(paymentType)) {
    filters.paymentType = paymentType;
  }

  return filters;
}

export function buildReceiptListWhere(
  tenantId: string,
  filters: ReceiptListFilters
): Prisma.ReceiptWhereInput {
  const where: Prisma.ReceiptWhereInput = { tenantId };

  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.dateFrom) {
    const from = pragueStartOfDayUtc(filters.dateFrom);
    if (from) createdAt.gte = from;
  }
  if (filters.dateTo) {
    const end = pragueEndExclusiveUtc(filters.dateTo);
    if (end) createdAt.lt = end;
  }
  if (Object.keys(createdAt).length > 0) {
    where.createdAt = createdAt;
  }

  if (filters.paymentType) {
    where.paymentType = filters.paymentType;
  }

  if (filters.category) {
    where.items = { some: { category: filters.category } };
  }

  return where;
}
