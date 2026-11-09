import { prisma } from "@/lib/prisma";
import {
  allocateSequenceNumberInTransaction,
  ensureSequencesForTenant,
} from "@/lib/sequences/repository";
import { buildReceiptItemSnapshotsFromCart } from "./build-cart-snapshots";
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

  const snapshotLines = await buildReceiptItemSnapshotsFromCart(
    input.tenantId,
    input.cart
  );

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
