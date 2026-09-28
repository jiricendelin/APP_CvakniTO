import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";

function deriveKey(): Buffer {
  return scryptSync(env.sessionSecret, "cvaknito-secret-v1", 32);
}

/** Šifrované uložení hesla k .p12 (SESSION_SECRET). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, deriveKey(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Neplatný formát šifrovaného hesla.");
  }
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv(ALGO, deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}
