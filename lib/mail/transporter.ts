import nodemailer from "nodemailer";
import type { SmtpSettings } from "@/lib/settings/smtp-schema";

export function createMailTransporter(settings: SmtpSettings) {
  const host = settings.smtpHost.trim();
  if (!host) {
    throw new Error("SMTP server není nastavený.");
  }

  const secure = settings.smtpEncryption === "ssl";
  const port = settings.smtpPort || (secure ? 465 : 587);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: settings.smtpEncryption === "starttls",
    auth:
      settings.smtpUser.trim()
        ? {
            user: settings.smtpUser.trim(),
            pass: settings.smtpPassword,
          }
        : undefined,
  });
}

export function mailFromAddress(settings: SmtpSettings): string {
  const email = settings.smtpFromEmail.trim();
  if (!email) {
    throw new Error("Chybí e-mail odesílatele v nastavení SMTP.");
  }
  const name = settings.smtpFromName.trim();
  if (name) {
    return `"${name.replace(/"/g, "")}" <${email}>`;
  }
  return email;
}
