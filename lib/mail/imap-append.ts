import { ImapFlow } from "imapflow";
import type { SmtpSettings } from "@/lib/settings/smtp-schema";
import type { TenantSettings } from "@/lib/settings/schema";

export type ImapAppendInput = {
  settings: TenantSettings;
  smtp: SmtpSettings;
  rawMessage: Buffer;
};

/**
 * Uloží odeslanou zprávu do složky Odeslané přes IMAP APPEND.
 * Vyžaduje imapEnabled + imapHost; login bere ze SMTP.
 */
export async function appendToSentFolder(
  input: ImapAppendInput
): Promise<void> {
  const { settings, smtp, rawMessage } = input;
  if (!settings.imapEnabled) return;

  const host = settings.imapHost.trim() || smtp.smtpHost.trim();
  if (!host) {
    throw new Error("IMAP host není nastavený.");
  }
  const user = smtp.smtpUser.trim();
  if (!user) {
    throw new Error("Chybí SMTP uživatel pro IMAP.");
  }

  const client = new ImapFlow({
    host,
    port: settings.imapPort || 993,
    secure: settings.imapSecure !== false,
    auth: {
      user,
      pass: smtp.smtpPassword,
    },
    logger: false,
  });

  try {
    await client.connect();
    const folder = settings.imapSentFolder.trim() || "Sent";
    await client.append(folder, rawMessage, ["\\Seen"]);
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }
}
