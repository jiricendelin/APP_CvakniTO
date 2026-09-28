import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getTenantSettings } from "@/lib/settings/repository";
import { SmtpSettingsForm } from "@/components/settings/smtp-settings-form";

export const dynamic = "force-dynamic";

export default async function SmtpSettingsPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const settings = await getTenantSettings(tenantId);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">E-mail (SMTP)</h1>
      <p className="text-sm text-muted-foreground">
        Odesílání faktur a upomínek. Port 465 (SSL) nebo 587 (STARTTLS).
      </p>
      <SmtpSettingsForm csrf={csrf} settings={settings} />
    </div>
  );
}
