import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { listCustomersForTenant } from "@/lib/customers/repository";
import { CustomersManager } from "@/components/customers/customers-manager";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const customers = await listCustomersForTenant(tenantId);

  return (
    <CustomersManager
      csrf={csrf}
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        ico: c.ico,
        dic: c.dic,
        address: c.address,
        email: c.email,
        phone: c.phone,
        note: c.note,
      }))}
    />
  );
}
