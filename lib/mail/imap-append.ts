import { ImapFlow } from "imapflow";
import type { SmtpSettings } from "@/lib/settings/smtp-schema";
import type { TenantSettings } from "@/lib/settings/schema";

export type ImapAppendInput = {
  settings: TenantSettings;
  smtp: SmtpSettings;
  rawMessage: Buffer;
};

const IMAP_CONNECT_TIMEOUT_MS = 12_000;
const IMAP_APPEND_TIMEOUT_MS = 60_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

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
    connectionTimeout: IMAP_CONNECT_TIMEOUT_MS,
    greetingTimeout: IMAP_CONNECT_TIMEOUT_MS,
  });

  client.on("error", (err: Error) => {
    console.error("[imap]", err.message);
  });

  try {
    await withTimeout(
      client.connect(),
      IMAP_CONNECT_TIMEOUT_MS,
      "IMAP připojení vypršelo."
    );
    const folder = settings.imapSentFolder.trim() || "Sent";
    await withTimeout(
      client.append(folder, rawMessage, ["\\Seen"]),
      IMAP_APPEND_TIMEOUT_MS,
      "IMAP ukládání do Odeslané vypršelo."
    );
  } finally {
    try {
      client.close();
    } catch {
      /* ignore */
    }
  }
}
