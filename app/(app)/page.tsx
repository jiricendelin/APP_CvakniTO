import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { listActivePriceItems } from "@/lib/pricelist/repository";
import {
  isPriceCategory,
  type PriceCategory,
} from "@/lib/pricelist/categories";
import { PosRegister } from "@/components/pos/pos-register";

export const dynamic = "force-dynamic";

export default async function PokladnaPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const items = await listActivePriceItems(tenantId);

  const catalog = items
    .filter(
      (item): item is (typeof items)[number] & { category: PriceCategory } =>
        isPriceCategory(item.category)
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      priceCents: item.priceCents,
      category: item.category,
    }));

  return <PosRegister items={catalog} csrf={csrf} />;
}
