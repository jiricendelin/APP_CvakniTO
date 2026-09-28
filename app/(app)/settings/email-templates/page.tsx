import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getTenantSettings } from "@/lib/settings/repository";
import { EmailTemplatesForm } from "@/components/settings/email-templates-form";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesSettingsPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const settings = await getTenantSettings(tenantId);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">E-mailové šablony</h1>
      <p className="text-sm text-muted-foreground">
        Faktura (s PDF), upomínka a poděkování.
      </p>
      <EmailTemplatesForm csrf={csrf} settings={settings} />
    </div>
  );
}
