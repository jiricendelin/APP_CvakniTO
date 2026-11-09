import { prisma } from "@/lib/prisma";
import {
  allocateSequenceNumberInTransaction,
  ensureSequencesForTenant,
} from "@/lib/sequences/repository";
import { receiptNumberToVariableSymbol } from "@/lib/receipts/variable-symbol";
import { addMonthsPrague } from "@/lib/time/prague-parts";
import {
  allocateVoucherNumberInTransaction,
  ensureVoucherSequence,
} from "./sequence";
import type { VoucherKind } from "./status";

export type CreateVoucherInput = {
  tenantId: string;
  kind: VoucherKind;
  priceItemId?: string | null;
  priceCents: number;
  buyerName: string;
  recipientName: string;
  buyerEmail?: string;
  giftCustomerId?: string | null;
  note?: string;
  validUntil?: Date;
};

export async function createVoucher(
  input: CreateVoucherInput
): Promise<{ voucherId: string; receiptId: string }> {
  await ensureSequencesForTenant(input.tenantId);
  await ensureVoucherSequence(input.tenantId);

  let serviceName = "Dárkový poukaz — hodnota";
  let priceItemId: string | null = null;
  let category = "ostatni";

  if (input.kind === "service") {
    if (!input.priceItemId) {
      throw new Error("Vyberte službu z ceníku.");
    }
    const item = await prisma.priceItem.findFirst({
      where: {
        id: input.priceItemId,
        tenantId: input.tenantId,
        active: true,
        giftEligible: true,
      },
    });
    if (!item) {
      throw new Error("Položka ceníku není dostupná jako dárkový poukaz.");
    }
    serviceName = item.name;
    priceItemId = item.id;
    category = item.category;
  }

  if (input.priceCents <= 0) {
    throw new Error("Cena musí být větší než nula.");
  }

  if (input.giftCustomerId) {
    const customer = await prisma.giftCustomer.findFirst({
      where: { id: input.giftCustomerId, tenantId: input.tenantId },
    });
    if (!customer) {
      throw new Error("Zákazník nenalezen.");
    }
  }

  const now = new Date();
  const validUntil = input.validUntil ?? addMonthsPrague(now, 6);

  return prisma.$transaction(async (tx) => {
    const voucherNumber = await allocateVoucherNumberInTransaction(
      tx,
      input.tenantId,
      now
    );
    const receiptNumber = await allocateSequenceNumberInTransaction(
      tx,
      input.tenantId,
      "receipt"
    );
    const variableSymbol = receiptNumberToVariableSymbol(receiptNumber);

    const receipt = await tx.receipt.create({
      data: {
        tenantId: input.tenantId,
        number: receiptNumber,
        variableSymbol,
        paymentType: "qr",
        totalCents: input.priceCents,
        eetStatus: "neodeslano",
        printOnIssue: false,
        paidAt: null,
        kind: "poukaz",
        giftCustomerId: input.giftCustomerId ?? null,
        remindersEnabled: true,
        items: {
          create: [
            {
              tenantId: input.tenantId,
              priceItemId,
              name: `Dárkový poukaz: ${serviceName}`,
              priceCents: input.priceCents,
              quantity: 1,
              category,
              lineTotalCents: input.priceCents,
            },
          ],
        },
      },
      select: { id: true },
    });

    const voucher = await tx.voucher.create({
      data: {
        tenantId: input.tenantId,
        number: voucherNumber,
        validUntil,
        buyerName: input.buyerName.trim(),
        recipientName: input.recipientName.trim(),
        buyerEmail: (input.buyerEmail ?? "").trim(),
        priceCents: input.priceCents,
        status: "vystaveny",
        kind: input.kind,
        priceItemId,
        serviceName,
        receiptId: receipt.id,
        giftCustomerId: input.giftCustomerId ?? null,
        note: (input.note ?? "").trim(),
      },
      select: { id: true },
    });

    return { voucherId: voucher.id, receiptId: receipt.id };
  });
}
