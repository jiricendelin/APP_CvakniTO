import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import {
  listPriceItems,
  seedDefaultPriceItemsIfEmpty,
} from "@/lib/pricelist/repository";
import { PricelistManager } from "@/components/settings/pricelist-manager";

export const dynamic = "force-dynamic";

export default async function PricelistPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  await seedDefaultPriceItemsIfEmpty(tenantId);
  const items = await listPriceItems(tenantId);

  return (
    <PricelistManager
      csrf={csrf}
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        priceCents: item.priceCents,
        category: item.category,
        active: item.active,
        sortOrder: item.sortOrder,
      }))}
    />
  );
}
