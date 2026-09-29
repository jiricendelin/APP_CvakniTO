import { prisma } from "@/lib/prisma";
import { isPriceCategory } from "@/lib/pricelist/categories";
import {
  allocateSequenceNumberInTransaction,
  ensureSequencesForTenant,
} from "@/lib/sequences/repository";
import type { CheckoutCartLine } from "./checkout-schema";
import type { PaymentType } from "./payment-type";
import { receiptNumberToVariableSymbol } from "./variable-symbol";

export type CreateReceiptInput = {
  tenantId: string;
  paymentType: PaymentType;
  printOnIssue: boolean;
  cart: CheckoutCartLine[];
};

export async function createReceiptFromCart(
  input: CreateReceiptInput
): Promise<string> {
  await ensureSequencesForTenant(input.tenantId);

  const snapshotLines: {
    priceItemId: string | null;
    name: string;
    priceCents: number;
    quantity: number;
    category: string;
    lineTotalCents: number;
  }[] = [];

  for (const line of input.cart) {
    if (line.kind === "catalog") {
      const item = await prisma.priceItem.findFirst({
        where: {
          id: line.priceItemId,
          tenantId: input.tenantId,
          active: true,
        },
      });
      if (!item || !isPriceCategory(item.category)) {
        throw new Error(`Položka ceníku „${line.name}“ už není k dispozici.`);
      }
      snapshotLines.push({
        priceItemId: item.id,
        name: item.name,
        priceCents: item.priceCents,
        quantity: line.quantity,
        category: item.category,
        lineTotalCents: item.priceCents * line.quantity,
      });
      continue;
    }

    if (!isPriceCategory(line.category)) {
      throw new Error("Neplatná kategorie položky.");
    }
    snapshotLines.push({
      priceItemId: null,
      name: line.name.trim(),
      priceCents: line.priceCents,
      quantity: line.quantity,
      category: line.category,
      lineTotalCents: line.priceCents * line.quantity,
    });
  }

  const totalCents = snapshotLines.reduce((s, l) => s + l.lineTotalCents, 0);
  if (totalCents <= 0) {
    throw new Error("Košík je prázdný.");
  }

  return prisma.$transaction(async (tx) => {
    const number = await allocateSequenceNumberInTransaction(
      tx,
      input.tenantId,
      "receipt"
    );
    const variableSymbol = receiptNumberToVariableSymbol(number);

    const receipt = await tx.receipt.create({
      data: {
        tenantId: input.tenantId,
        number,
        variableSymbol,
        paymentType: input.paymentType,
        totalCents,
        eetStatus: "neodeslano",
        printOnIssue: input.printOnIssue,
        paidAt: input.paymentType === "hotove" ? new Date() : null,
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

    return receipt.id;
  });
}
