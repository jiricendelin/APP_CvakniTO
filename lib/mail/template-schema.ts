import { z } from "zod";
import {
  DEFAULT_MAIL_INVOICE_SUBJECT,
  DEFAULT_MAIL_INVOICE_TEXT,
  DEFAULT_MAIL_REMINDER_SUBJECT,
  DEFAULT_MAIL_REMINDER_TEXT,
  DEFAULT_MAIL_THANKS_SUBJECT,
  DEFAULT_MAIL_THANKS_TEXT,
  DEFAULT_MAIL_VOUCHER_SUBJECT,
  DEFAULT_MAIL_VOUCHER_TEXT,
  DEFAULT_MAIL_VOUCHER_ACTIVATION_SUBJECT,
  DEFAULT_MAIL_VOUCHER_ACTIVATION_TEXT,
  DEFAULT_MAIL_RECEIPT_SUBJECT,
  DEFAULT_MAIL_RECEIPT_TEXT,
  DEFAULT_MAIL_RECEIPT_REMINDER_SUBJECT,
  DEFAULT_MAIL_RECEIPT_REMINDER_TEXT,
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
  mailVoucherSubject: z.string().max(500).optional().default(DEFAULT_MAIL_VOUCHER_SUBJECT),
  mailVoucherText: z.string().max(20_000).optional().default(DEFAULT_MAIL_VOUCHER_TEXT),
  mailVoucherHtml: z.string().max(50_000).optional().default(""),
  mailVoucherActivationSubject: z
    .string()
    .max(500)
    .optional()
    .default(DEFAULT_MAIL_VOUCHER_ACTIVATION_SUBJECT),
  mailVoucherActivationText: z
    .string()
    .max(20_000)
    .optional()
    .default(DEFAULT_MAIL_VOUCHER_ACTIVATION_TEXT),
  mailVoucherActivationHtml: z.string().max(50_000).optional().default(""),
  mailReceiptSubject: z.string().max(500).optional().default(DEFAULT_MAIL_RECEIPT_SUBJECT),
  mailReceiptText: z.string().max(20_000).optional().default(DEFAULT_MAIL_RECEIPT_TEXT),
  mailReceiptHtml: z.string().max(50_000).optional().default(""),
  mailReceiptReminderSubject: z
    .string()
    .max(500)
    .optional()
    .default(DEFAULT_MAIL_RECEIPT_REMINDER_SUBJECT),
  mailReceiptReminderText: z
    .string()
    .max(20_000)
    .optional()
    .default(DEFAULT_MAIL_RECEIPT_REMINDER_TEXT),
  mailReceiptReminderHtml: z.string().max(50_000).optional().default(""),
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
  mailVoucherSubject: z.string().max(500),
  mailVoucherText: z.string().max(20_000),
  mailVoucherHtml: z.string().max(50_000),
  mailVoucherActivationSubject: z.string().max(500),
  mailVoucherActivationText: z.string().max(20_000),
  mailVoucherActivationHtml: z.string().max(50_000),
  mailReceiptSubject: z.string().max(500),
  mailReceiptText: z.string().max(20_000),
  mailReceiptHtml: z.string().max(50_000),
  mailReceiptReminderSubject: z.string().max(500),
  mailReceiptReminderText: z.string().max(20_000),
  mailReceiptReminderHtml: z.string().max(50_000),
});
