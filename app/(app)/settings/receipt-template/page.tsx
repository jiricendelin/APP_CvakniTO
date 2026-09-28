import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getTenantSettings } from "@/lib/settings/repository";
import { ReceiptTemplateEditor } from "@/components/settings/receipt-template-editor";

export const dynamic = "force-dynamic";

export default async function ReceiptTemplateSettingsPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const settings = await getTenantSettings(tenantId);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Šablona účtenky</h1>
      <p className="text-sm text-muted-foreground">
        Text účtenky pro tisk. Náhled se mění hned při úpravě šablony.
      </p>
      <ReceiptTemplateEditor csrf={csrf} settings={settings} />
    </div>
  );
}
