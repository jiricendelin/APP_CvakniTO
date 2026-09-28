import { prisma } from "@/lib/prisma";
import {
  parseTenantSettings,
  type TenantSettings,
  tenantSettingsSchema,
} from "./schema";

export async function getTenantSettings(
  tenantId: string
): Promise<TenantSettings> {
  const row = await prisma.setting.findUnique({
    where: { tenantId },
    select: { data: true },
  });
  return parseTenantSettings(row?.data);
}

export async function saveTenantSettings(
  tenantId: string,
  settings: TenantSettings
): Promise<void> {
  const data = tenantSettingsSchema.parse(settings);
  await prisma.setting.upsert({
    where: { tenantId },
    create: { tenantId, data },
    update: { data },
  });
}
