import type { TenantSettings } from "./schema";
import type { SmtpSettings } from "./smtp-schema";

export function getSmtpSettingsFromTenant(
  settings: TenantSettings
): SmtpSettings {
  return {
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpEncryption: settings.smtpEncryption,
    smtpUser: settings.smtpUser,
    smtpPassword: settings.smtpPassword,
    smtpFromEmail: settings.smtpFromEmail,
    smtpFromName: settings.smtpFromName,
  };
}
