import { formatCzk } from "@/lib/money";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import { renderReceiptPdfBuffer } from "@/lib/receipts/pdf/render-receipt-pdf";
import { getTenantSettings } from "@/lib/settings/repository";
import { renderMailTemplate } from "@/lib/mail/render-template";
import { sendTenantMail } from "@/lib/mail/send";
import {
  DEFAULT_MAIL_RECEIPT_SUBJECT,
  DEFAULT_MAIL_RECEIPT_TEXT,
  DEFAULT_MAIL_RECEIPT_REMINDER_SUBJECT,
  DEFAULT_MAIL_RECEIPT_REMINDER_TEXT,
} from "@/lib/mail/template-defaults";
import { prisma } from "@/lib/prisma";

function buildReceiptCtx(
  settings: Awaited<ReturnType<typeof getTenantSettings>>,
  receipt: NonNullable<Awaited<ReturnType<typeof getReceiptForTenant>>>,
  customerName: string
) {
  return {
    companyName: settings.companyName || "CvakniTO",
    receiptNumber: receipt.number,
    variableSymbol: receipt.variableSymbol,
    totalCzk: formatCzk(receipt.totalCents),
    customerName,
  };
}

export async function sendReceiptMail(input: {
  tenantId: string;
  receiptId: string;
  to: string;
  customerName?: string;
  reminder?: boolean;
}): Promise<void> {
  const [receipt, settings] = await Promise.all([
    getReceiptForTenant(input.tenantId, input.receiptId),
    getTenantSettings(input.tenantId),
  ]);
  if (!receipt) throw new Error("Účtenka nenalezena.");

  const to = input.to.trim();
  if (!to) throw new Error("Chybí e-mail příjemce.");

  const ctx = buildReceiptCtx(
    settings,
    receipt,
    input.customerName?.trim() || ""
  );

  const subjectTpl = input.reminder
    ? settings.mailReceiptReminderSubject || DEFAULT_MAIL_RECEIPT_REMINDER_SUBJECT
    : settings.mailReceiptSubject || DEFAULT_MAIL_RECEIPT_SUBJECT;
  const textTpl = input.reminder
    ? settings.mailReceiptReminderText || DEFAULT_MAIL_RECEIPT_REMINDER_TEXT
    : settings.mailReceiptText || DEFAULT_MAIL_RECEIPT_TEXT;
  const htmlTpl = input.reminder
    ? settings.mailReceiptReminderHtml?.trim() || ""
    : settings.mailReceiptHtml?.trim() || "";

  const subject = renderMailTemplate(subjectTpl, ctx);
  const text = renderMailTemplate(textTpl, ctx);
  const html = htmlTpl ? renderMailTemplate(htmlTpl, ctx) : undefined;

  const pdf = await renderReceiptPdfBuffer(receipt, settings);

  await sendTenantMail({
    tenantId: input.tenantId,
    tenantSettings: settings,
    to,
    subject,
    text,
    html,
    kind: input.reminder ? "receipt_reminder" : "receipt",
    meta: { receiptId: receipt.id },
    attachments: [
      {
        filename: `uctenka-${receipt.number.replace(/[^\w.-]+/g, "_")}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  if (input.reminder) {
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { reminderSentAt: new Date() },
    });
  }
}
