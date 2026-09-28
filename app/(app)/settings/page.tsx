import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getTenantSettings } from "@/lib/settings/repository";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const settings = await getTenantSettings(tenantId);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Nastavení</h1>
      <p className="text-sm text-muted-foreground">
        Firma, platební údaje a barva aplikace.
      </p>
      <GeneralSettingsForm csrf={csrf} settings={settings} />
    </div>
  );
}
