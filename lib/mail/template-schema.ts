import { z } from "zod";
import {
  DEFAULT_MAIL_INVOICE_SUBJECT,
  DEFAULT_MAIL_INVOICE_TEXT,
  DEFAULT_MAIL_REMINDER_SUBJECT,
  DEFAULT_MAIL_REMINDER_TEXT,
  DEFAULT_MAIL_THANKS_SUBJECT,
  DEFAULT_MAIL_THANKS_TEXT,
} from "./template-defaults";

export const mailTemplatesSchema = z.object({
  mailInvoiceSubject: z.string().max(500).optional().default(DEFAULT_MAIL_INVOICE_SUBJECT),
  mailInvoiceText: z.string().max(20_000).optional().default(DEFAULT_MAIL_INVOICE_TEXT),
  mailInvoiceHtml: z.string().max(50_000).optional().default(""),
  mailReminderSubject: z.string().max(500).optional().default(DEFAULT_MAIL_REMINDER_SUBJECT),
  mailReminderText: z.string().max(20_000).optional().default(DEFAULT_MAIL_REMINDER_TEXT),
  mailReminderHtml: z.string().max(50_000).optional().default(""),
  mailThanksSubject: z.string().max(500).optional().default(DEFAULT_MAIL_THANKS_SUBJECT),
  mailThanksText: z.string().max(20_000).optional().default(DEFAULT_MAIL_THANKS_TEXT),
  mailThanksHtml: z.string().max(50_000).optional().default(""),
});

export const mailTemplatesFormSchema = z.object({
  mailInvoiceSubject: z.string().max(500),
  mailInvoiceText: z.string().max(20_000),
  mailInvoiceHtml: z.string().max(50_000),
  mailReminderSubject: z.string().max(500),
  mailReminderText: z.string().max(20_000),
  mailReminderHtml: z.string().max(50_000),
  mailThanksSubject: z.string().max(500),
  mailThanksText: z.string().max(20_000),
  mailThanksHtml: z.string().max(50_000),
});
