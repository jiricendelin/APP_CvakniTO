"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { buildInvoiceMailContext } from "@/lib/mail/invoice-mail-context";
import { renderMailTemplate } from "@/lib/mail/render-template";
import { formatSmtpError, sendMail } from "@/lib/mail/send";
import {
  DEFAULT_MAIL_INVOICE_SUBJECT,
  DEFAULT_MAIL_INVOICE_TEXT,
  DEFAULT_MAIL_REMINDER_SUBJECT,
  DEFAULT_MAIL_REMINDER_TEXT,
  DEFAULT_MAIL_THANKS_SUBJECT,
  DEFAULT_MAIL_THANKS_TEXT,
} from "@/lib/mail/template-defaults";
import { renderInvoicePdfBuffer } from "@/lib/invoices/pdf/render-invoice-pdf";
import { getInvoiceForTenant } from "@/lib/invoices/repository";
import { getTenantSettings } from "@/lib/settings/repository";
import { getSmtpSettingsFromTenant } from "@/lib/settings/smtp-from-tenant";

export type InvoiceEmailState = {
  error?: string;
  success?: string;
};

type MailKind = "invoice" | "reminder" | "thanks";

async function loadInvoiceBundle(tenantId: string, invoiceId: string) {
  const [invoice, settings] = await Promise.all([
    getInvoiceForTenant(tenantId, invoiceId),
    getTenantSettings(tenantId),
  ]);
  if (!invoice) return null;
  return { invoice, settings };
}

function pickTemplate(
  settings: Awaited<ReturnType<typeof getTenantSettings>>,
  kind: MailKind
) {
  if (kind === "invoice") {
    return {
      subject: settings.mailInvoiceSubject || DEFAULT_MAIL_INVOICE_SUBJECT,
      text: settings.mailInvoiceText || DEFAULT_MAIL_INVOICE_TEXT,
      html: settings.mailInvoiceHtml?.trim() || "",
    };
  }
  if (kind === "reminder") {
    return {
      subject: settings.mailReminderSubject || DEFAULT_MAIL_REMINDER_SUBJECT,
      text: settings.mailReminderText || DEFAULT_MAIL_REMINDER_TEXT,
      html: settings.mailReminderHtml?.trim() || "",
    };
  }
  return {
    subject: settings.mailThanksSubject || DEFAULT_MAIL_THANKS_SUBJECT,
    text: settings.mailThanksText || DEFAULT_MAIL_THANKS_TEXT,
    html: settings.mailThanksHtml?.trim() || "",
  };
}

async function sendInvoiceMail(
  invoiceId: string,
  kind: MailKind,
  attachPdf: boolean,
  markSent: boolean
): Promise<InvoiceEmailState> {
  const tenantId = await getTenantId();
  const bundle = await loadInvoiceBundle(tenantId, invoiceId);
  if (!bundle) return { error: "Faktura nenalezena." };

  const { invoice, settings } = bundle;
  if (invoice.status === "koncept") {
    return { error: "Fakturu nejdřív vystavte." };
  }
  const to = invoice.customer.email.trim();
  if (!to) {
    return { error: "U zákazníka chybí e-mail." };
  }

  const ctx = buildInvoiceMailContext({
    settings,
    invoice,
    customer: invoice.customer,
  });
  const tpl = pickTemplate(settings, kind);
  const subject = renderMailTemplate(tpl.subject, ctx);
  const text = renderMailTemplate(tpl.text, ctx);
  const html = tpl.html
    ? renderMailTemplate(tpl.html, ctx)
    : undefined;

  const attachments = [];
  if (attachPdf) {
    const pdf = await renderInvoicePdfBuffer(invoice, settings);
    attachments.push({
      filename: `faktura-${invoice.number.replace(/[^\w.-]+/g, "_")}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    });
  }

  try {
    await sendMail({
      settings: getSmtpSettingsFromTenant(settings),
      to,
      subject,
      text,
      html,
      attachments,
    });
  } catch (e) {
    return { error: formatSmtpError(e) };
  }

  if (markSent && !invoice.sentAt) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { sentAt: new Date() },
    });
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return { success: "E-mail odeslán." };
}

export async function sendInvoiceEmailAction(
  _prev: InvoiceEmailState,
  formData: FormData
): Promise<InvoiceEmailState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return { error: "Chybí ID faktury." };
  return sendInvoiceMail(invoiceId, "invoice", true, true);
}

export async function sendReminderEmailAction(
  _prev: InvoiceEmailState,
  formData: FormData
): Promise<InvoiceEmailState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return { error: "Chybí ID faktury." };
  return sendInvoiceMail(invoiceId, "reminder", false, false);
}

export async function sendThanksEmailAction(
  _prev: InvoiceEmailState,
  formData: FormData
): Promise<InvoiceEmailState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }
  const invoiceId = String(formData.get("invoiceId") ?? "");
  if (!invoiceId) return { error: "Chybí ID faktury." };
  return sendInvoiceMail(invoiceId, "thanks", false, false);
}
