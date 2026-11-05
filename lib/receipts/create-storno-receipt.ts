import { prisma } from "@/lib/prisma";
import {
  allocateSequenceNumberInTransaction,
  ensureSequencesForTenant,
} from "@/lib/sequences/repository";
import { receiptNumberToVariableSymbol } from "./variable-symbol";

export type CreateStornoReceiptInput = {
  tenantId: string;
  giftCustomerId: string;
  amountCents: number;
  description?: string;
};

export async function createStornoReceipt(
  input: CreateStornoReceiptInput
): Promise<string> {
  if (input.amountCents <= 0) {
    throw new Error("Částka musí být větší než nula.");
  }

  const customer = await prisma.giftCustomer.findFirst({
    where: { id: input.giftCustomerId, tenantId: input.tenantId },
  });
  if (!customer) {
    throw new Error("Zákazník DP nenalezen.");
  }

  await ensureSequencesForTenant(input.tenantId);

  const name =
    input.description?.trim() ||
    `Storno poplatek — ${customer.firstName} ${customer.lastName}`.trim();

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
        paymentType: "qr",
        totalCents: input.amountCents,
        eetStatus: "neodeslano",
        printOnIssue: false,
        paidAt: null,
        kind: "storno",
        giftCustomerId: customer.id,
        remindersEnabled: false,
        items: {
          create: [
            {
              tenantId: input.tenantId,
              priceItemId: null,
              name,
              priceCents: input.amountCents,
              quantity: 1,
              category: "ostatni",
              lineTotalCents: input.amountCents,
            },
          ],
        },
      },
      select: { id: true },
    });

    await tx.giftCustomer.update({
      where: { id: customer.id },
      data: {
        awaitingStornoPayment: true,
        stornoFeeCents: input.amountCents,
      },
    });

    return receipt.id;
  });
}
