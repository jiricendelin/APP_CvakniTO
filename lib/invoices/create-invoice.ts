import { prisma } from "@/lib/prisma";
import { isPriceCategory } from "@/lib/pricelist/categories";
import { allocateSequenceNumberInTransaction } from "@/lib/sequences/repository";
import { ensureSequencesForTenant } from "@/lib/sequences/repository";
import { receiptNumberToVariableSymbol } from "@/lib/receipts/variable-symbol";
import { pragueStartOfDayUtc } from "@/lib/time/prague";
import type { CreateInvoiceLine } from "./invoice-schema";

export type CreateInvoiceInput = {
  tenantId: string;
  customerId: string;
  dueDateYmd: string;
  lines: CreateInvoiceLine[];
};

export async function createInvoice(input: CreateInvoiceInput): Promise<string> {
  const dueDate = pragueStartOfDayUtc(input.dueDateYmd);
  if (!dueDate) {
    throw new Error("Neplatné datum splatnosti.");
  }

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenantId: input.tenantId },
    select: { id: true },
  });
  if (!customer) {
    throw new Error("Zákazník nenalezen.");
  }

  const snapshotLines = input.lines.map((line) => {
    if (!isPriceCategory(line.category)) {
      throw new Error("Neplatná kategorie položky.");
    }
    return {
      name: line.name.trim(),
      priceCents: line.priceCents,
      quantity: line.quantity,
      category: line.category,
      lineTotalCents: line.priceCents * line.quantity,
      priceItemId: null as string | null,
    };
  });

  const totalCents = snapshotLines.reduce((s, l) => s + l.lineTotalCents, 0);
  if (totalCents <= 0) {
    throw new Error("Součet faktury musí být větší než nula.");
  }

  await ensureSequencesForTenant(input.tenantId);

  return prisma.$transaction(async (tx) => {
    const number = await allocateSequenceNumberInTransaction(
      tx,
      input.tenantId,
      "invoice"
    );
    const variableSymbol = receiptNumberToVariableSymbol(number);

    const invoice = await tx.invoice.create({
      data: {
        tenantId: input.tenantId,
        customerId: input.customerId,
        number,
        variableSymbol,
        status: "koncept",
        totalCents,
        dueDate,
        items: {
          create: snapshotLines.map((line) => ({
            tenantId: input.tenantId,
            priceItemId: line.priceItemId,
            name: line.name,
            priceCents: line.priceCents,
            quantity: line.quantity,
            category: line.category,
            lineTotalCents: line.lineTotalCents,
          })),
        },
      },
      select: { id: true },
    });

    return invoice.id;
  });
}
