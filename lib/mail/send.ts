import type { SmtpSettings } from "@/lib/settings/smtp-schema";
import { createMailTransporter, mailFromAddress } from "./transporter";

export type SendMailInput = {
  settings: SmtpSettings;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType?: string;
  }[];
};

export async function sendMail(input: SendMailInput): Promise<void> {
  const transporter = createMailTransporter(input.settings);
  await transporter.sendMail({
    from: mailFromAddress(input.settings),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br>\n"),
    attachments: input.attachments,
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
