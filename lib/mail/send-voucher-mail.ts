import { prisma } from "@/lib/prisma";
import { getTenantSettings } from "@/lib/settings/repository";
import { renderMailTemplate } from "@/lib/mail/render-template";
import { sendTenantMail } from "@/lib/mail/send";
import {
  DEFAULT_MAIL_VOUCHER_SUBJECT,
  DEFAULT_MAIL_VOUCHER_TEXT,
  DEFAULT_MAIL_VOUCHER_ACTIVATION_SUBJECT,
  DEFAULT_MAIL_VOUCHER_ACTIVATION_TEXT,
} from "@/lib/mail/template-defaults";
import { buildVoucherMailContext } from "@/lib/mail/voucher-mail-context";
import { renderVoucherPdfBuffer } from "@/lib/vouchers/pdf/render-voucher-pdf";
import { renderReceiptPdfBuffer } from "@/lib/receipts/pdf/render-receipt-pdf";

async function loadVoucherBundle(tenantId: string, voucherId: string) {
  const [voucher, settings] = await Promise.all([
    prisma.voucher.findFirst({
      where: { id: voucherId, tenantId },
      include: {
        receipt: { include: { items: true } },
      },
    }),
    getTenantSettings(tenantId),
  ]);
  if (!voucher || !voucher.receipt) return null;
  return { voucher, settings, receipt: voucher.receipt };
}

export async function sendVoucherIssueMail(
  tenantId: string,
  voucherId: string,
  toOverride?: string
): Promise<void> {
  const bundle = await loadVoucherBundle(tenantId, voucherId);
  if (!bundle) throw new Error("Poukaz nenalezen.");

  const { voucher, settings, receipt } = bundle;
  const to = (toOverride ?? voucher.buyerEmail).trim();
  if (!to) throw new Error("Chybí e-mail kupujícího.");

  const ctx = buildVoucherMailContext({
    settings,
    voucherNumber: voucher.number,
    recipientName: voucher.recipientName,
    buyerName: voucher.buyerName,
    validUntil: voucher.validUntil,
    totalCents: voucher.priceCents,
    variableSymbol: receipt.variableSymbol,
    receiptNumber: receipt.number,
    serviceName: voucher.serviceName,
  });

  const subject = renderMailTemplate(
    settings.mailVoucherSubject || DEFAULT_MAIL_VOUCHER_SUBJECT,
    ctx
  );
  const text = renderMailTemplate(
    settings.mailVoucherText || DEFAULT_MAIL_VOUCHER_TEXT,
    ctx
  );
  const htmlRaw = settings.mailVoucherHtml?.trim() || "";
  const html = htmlRaw ? renderMailTemplate(htmlRaw, ctx) : undefined;

  const [voucherPdf, receiptPdf] = await Promise.all([
    renderVoucherPdfBuffer({
      tenantId,
      settings,
      number: voucher.number,
      validUntil: voucher.validUntil,
      kind: voucher.kind,
      priceItemId: voucher.priceItemId,
      serviceName: voucher.serviceName,
    }),
    renderReceiptPdfBuffer(receipt, settings),
  ]);

  await sendTenantMail({
    tenantId,
    tenantSettings: settings,
    to,
    subject,
    text,
    html,
    kind: "voucher_issue",
    meta: { voucherId, receiptId: receipt.id },
    attachments: [
      {
        filename: `poukaz-${voucher.number}.pdf`,
        content: voucherPdf,
        contentType: "application/pdf",
      },
      {
        filename: `uctenka-${receipt.number}.pdf`,
        content: receiptPdf,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendVoucherActivationMail(
  tenantId: string,
  voucherId: string
): Promise<void> {
  const bundle = await loadVoucherBundle(tenantId, voucherId);
  if (!bundle) throw new Error("Poukaz nenalezen.");

  const { voucher, settings, receipt } = bundle;
  const to = voucher.buyerEmail.trim();
  if (!to) return;

  const ctx = buildVoucherMailContext({
    settings,
    voucherNumber: voucher.number,
    recipientName: voucher.recipientName,
    buyerName: voucher.buyerName,
    validUntil: voucher.validUntil,
    totalCents: voucher.priceCents,
    variableSymbol: receipt.variableSymbol,
    receiptNumber: receipt.number,
    serviceName: voucher.serviceName,
  });

  const subject = renderMailTemplate(
    settings.mailVoucherActivationSubject ||
      DEFAULT_MAIL_VOUCHER_ACTIVATION_SUBJECT,
    ctx
  );
  const text = renderMailTemplate(
    settings.mailVoucherActivationText || DEFAULT_MAIL_VOUCHER_ACTIVATION_TEXT,
    ctx
  );
  const htmlRaw = settings.mailVoucherActivationHtml?.trim() || "";
  const html = htmlRaw ? renderMailTemplate(htmlRaw, ctx) : undefined;

  await sendTenantMail({
    tenantId,
    tenantSettings: settings,
    to,
    subject,
    text,
    html,
    kind: "voucher_activation",
    meta: { voucherId },
  });
}
