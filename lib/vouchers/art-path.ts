import { mkdir, access, constants, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export function getVoucherArtRoot(tenantId: string): string {
  const root =
    process.env.VOUCHER_ART_DIR?.trim() ||
    path.join(process.cwd(), "data", "vouchers");
  return path.join(root, tenantId);
}

export async function ensureVoucherArtDir(tenantId: string): Promise<string> {
  const dir = getVoucherArtRoot(tenantId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function resolveVoucherArtFile(
  tenantId: string,
  filename: string
): string | null {
  const safe = path.basename(filename);
  if (!safe || safe !== filename.replace(/\\/g, "/").split("/").pop()) {
    return null;
  }
  return path.join(getVoucherArtRoot(tenantId), safe);
}

export async function voucherArtExists(
  tenantId: string,
  filename: string
): Promise<boolean> {
  const full = resolveVoucherArtFile(tenantId, filename);
  if (!full) return false;
  try {
    await access(full, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function saveVoucherArtFile(
  tenantId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const dir = await ensureVoucherArtDir(tenantId);
  const safe = path.basename(filename).replace(/[^\w.-]+/g, "_");
  await writeFile(path.join(dir, safe), buffer);
  return safe;
}

export async function deleteVoucherArtFile(
  tenantId: string,
  filename: string
): Promise<void> {
  const full = resolveVoucherArtFile(tenantId, filename);
  if (!full) return;
  try {
    await unlink(full);
  } catch {
    /* ignore */
  }
}
