import { mkdir, access, constants } from "node:fs/promises";
import path from "node:path";

export function getEetDataRoot(): string {
  return process.env.EET_DATA_DIR?.trim() || path.join(process.cwd(), "data", "eet");
}

export function getTenantCertPath(tenantId: string): string {
  return path.join(getEetDataRoot(), `${tenantId}.p12`);
}

export async function ensureEetDataDir(): Promise<void> {
  await mkdir(getEetDataRoot(), { recursive: true });
}

export async function tenantCertExists(tenantId: string): Promise<boolean> {
  try {
    await access(getTenantCertPath(tenantId), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
