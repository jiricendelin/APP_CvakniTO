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

export async function sendMail(input: SendMailInput): Promise<void> {
  const { text, html } = applySignature(
    input.text,
    input.html,
    input.tenantSettings
  );

  const transporter = createMailTransporter(input.settings);
  const from = mailFromAddress(input.settings);

  const info = await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text,
    html,
    attachments: input.attachments,
  });

  let imapError = "";
  if (input.tenantSettings?.imapEnabled) {
    try {
      const raw =
        typeof info.message === "string"
          ? Buffer.from(info.message)
          : Buffer.isBuffer(info.message)
            ? info.message
            : null;

      if (raw) {
        await appendToSentFolder({
          settings: input.tenantSettings,
          smtp: input.settings,
          rawMessage: raw,
        });
      } else {
        // Nodemailer nemusí vrátit raw — sestavíme jednoduchou MIME kopii.
        const boundary = `cvaknito_${Date.now()}`;
        const parts: string[] = [
          `From: ${from}`,
          `To: ${input.to}`,
          `Subject: ${input.subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          text,
          `--${boundary}`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          html,
          `--${boundary}--`,
          ``,
        ];
        await appendToSentFolder({
          settings: input.tenantSettings,
          smtp: input.settings,
          rawMessage: Buffer.from(parts.join("\r\n"), "utf8"),
        });
      }
    } catch (e) {
      imapError = e instanceof Error ? e.message : "IMAP APPEND selhalo.";
      console.error("[sendMail] IMAP APPEND failed", imapError);
    }
  }

  if (input.tenantId) {
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
