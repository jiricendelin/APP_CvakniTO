import { getCsrfToken } from "@/lib/auth/csrf";
import { requireUser, getTenantId } from "@/lib/auth";
import { getTenantSettings } from "@/lib/settings/repository";
import { listPriceItems, seedDefaultPriceItemsIfEmpty } from "@/lib/pricelist/repository";
import { listSequences, sequencePreview } from "@/lib/sequences/repository";
import { isSequenceKind } from "@/lib/sequences/kinds";
import { tenantCertExists } from "@/lib/eet/cert-path";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const tenantId = await getTenantId();
  await seedDefaultPriceItemsIfEmpty(tenantId);

  const [csrf, settings, priceItems, sequences, hasCert] = await Promise.all([
    getCsrfToken(),
    getTenantSettings(tenantId),
    listPriceItems(tenantId),
    listSequences(tenantId),
    tenantCertExists(tenantId),
  ]);

  const sequenceRows = sequences
    .filter(
      (s): s is (typeof sequences)[number] & { kind: "receipt" | "invoice" } =>
        isSequenceKind(s.kind)
    )
    .map((s) => ({
      kind: s.kind,
      prefix: s.prefix,
      format: s.format,
      resetYearly: s.resetYearly,
      preview: sequencePreview(s),
      nextValue: s.nextValue,
    }));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Nastavení</h1>
        <p className="text-sm text-muted-foreground">
          Firma, platební údaje, ceník, číselné řady, e-maily a EET.
        </p>
      </div>
      <SettingsTabs
        csrf={csrf}
        settings={settings}
        priceItems={priceItems.map((item) => ({
          id: item.id,
          name: item.name,
          priceCents: item.priceCents,
          category: item.category,
          active: item.active,
          sortOrder: item.sortOrder,
        }))}
        sequenceRows={sequenceRows}
        hasCert={hasCert}
        userEmail={user.email}
      />
    </div>
  );
}
