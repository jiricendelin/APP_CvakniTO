import nodemailer from "nodemailer";
import type { SmtpSettings } from "@/lib/settings/smtp-schema";
import type { TenantSettings } from "@/lib/settings/schema";
import { prisma } from "@/lib/prisma";
import { createMailTransporter, mailFromAddress } from "./transporter";
import { appendToSentFolder } from "./imap-append";
import { getSmtpSettingsFromTenant } from "@/lib/settings/smtp-from-tenant";

export type SendMailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendMailInput = {
  settings: SmtpSettings;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: SendMailAttachment[];
  /** Pro podpis, IMAP a MailLog. */
  tenantSettings?: TenantSettings;
  tenantId?: string;
  kind?: string;
  meta?: Record<string, unknown>;
};

function applySignature(
  text: string,
  html: string | undefined,
  tenantSettings?: TenantSettings
): { text: string; html: string } {
  const sigText = tenantSettings?.mailSignatureText?.trim() ?? "";
  const sigHtml = tenantSettings?.mailSignatureHtml?.trim() ?? "";

  let outText = text;
  if (sigText) {
    outText = `${text.trimEnd()}\n\n${sigText}`;
  }

  let outHtml =
    html ?? text.replace(/\n/g, "<br>\n");
  if (sigHtml) {
    outHtml = `${outHtml}<br><br>${sigHtml}`;
  } else if (sigText) {
    outHtml = `${outHtml}<br><br>${sigText.replace(/\n/g, "<br>\n")}`;
  }

  return { text: outText, html: outHtml };
}

/** Sestaví kompletní MIME (přílohy, RFC 2047 předmět) — stejný buffer jde na SMTP i do IMAP. */
async function compileRawMessage(mail: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: SendMailAttachment[];
}): Promise<Buffer> {
  const compiler = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "windows",
  });
  const compiled = await compiler.sendMail(mail);
  const raw = compiled.message;
  if (!Buffer.isBuffer(raw)) {
    throw new Error("Nepodařilo se sestavit MIME zprávu.");
  }
  return raw;
}

export async function sendMail(input: SendMailInput): Promise<void> {
  const { text, html } = applySignature(
    input.text,
    input.html,
    input.tenantSettings
  );

  const transporter = createMailTransporter(input.settings);
  const from = mailFromAddress(input.settings);
  const fromEmail = input.settings.smtpFromEmail.trim();

  const raw = await compileRawMessage({
    from,
    to: input.to,
    subject: input.subject,
    text,
    html,
    attachments: input.attachments,
  });

  const info = await transporter.sendMail({
    envelope: { from: fromEmail, to: input.to },
    raw,
  });

  let imapError = "";
  if (input.tenantSettings?.imapEnabled) {
    try {
      await appendToSentFolder({
        settings: input.tenantSettings,
        smtp: input.settings,
        rawMessage: raw,
      });
    } catch (e) {
      imapError = e instanceof Error ? e.message : "IMAP APPEND selhalo.";
      console.error("[sendMail] IMAP APPEND failed", imapError);
    }
  }

  if (input.tenantId) {
    try {
      await prisma.mailLog.create({
        data: {
          tenantId: input.tenantId,
          kind: input.kind ?? "generic",
          toEmail: input.to,
          subject: input.subject,
          status: imapError ? "sent_imap_error" : "sent",
          error: imapError,
          meta: {
            ...(input.meta ?? {}),
            messageId: info.messageId ?? null,
          },
        },
      });
    } catch (e) {
      console.error("[sendMail] mailLog.create failed", e);
    }
  }
}

/** Pohodlný wrapper se tenant settings. */
export async function sendTenantMail(input: {
  tenantId: string;
  tenantSettings: TenantSettings;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: SendMailAttachment[];
  kind: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await sendMail({
    settings: getSmtpSettingsFromTenant(input.tenantSettings),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments,
    tenantSettings: input.tenantSettings,
    tenantId: input.tenantId,
    kind: input.kind,
    meta: input.meta,
  });
}

export function formatSmtpError(error: unknown): string {
  if (error instanceof Error) {
    const anyErr = error as Error & { code?: string; response?: string };
    const parts = [error.message];
    if (anyErr.code) parts.push(`(${anyErr.code})`);
    if (anyErr.response) parts.push(anyErr.response);
    return parts.join(" ");
  }
  return "Odeslání e-mailu selhalo.";
}
