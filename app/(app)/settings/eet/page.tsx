import Link from "next/link";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { tenantCertExists } from "@/lib/eet/cert-path";
import { getTenantSettings } from "@/lib/settings/repository";
import { EetSettingsForm } from "@/components/settings/eet-settings-form";

export const dynamic = "force-dynamic";

export default async function EetSettingsPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const settings = await getTenantSettings(tenantId);
  const hasCert = await tenantCertExists(tenantId);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">EET 2.0</h1>
      <p className="text-sm text-muted-foreground">
        Certifikát (.p12), provozovna a pokladna. Soubor se ukládá mimo web do
        volume (<code className="text-xs">EET_DATA_DIR</code>).
      </p>
      <EetSettingsForm csrf={csrf} settings={settings} hasCert={hasCert} />
      <Link href="/settings" className="text-sm text-primary hover:underline">
        ← Nastavení
      </Link>
    </div>
  );
}
