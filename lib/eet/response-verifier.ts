import { readFile } from "node:fs/promises";
import { createCryptoKeyResponseSignatureVerifier } from "@finitoapp/eet-client";
import type { ResponseSignatureVerifier } from "@finitoapp/eet-client";

let cachedPlaygroundVerifier: ResponseSignatureVerifier | null = null;

async function loadPlaygroundResponseCertDer(): Promise<Uint8Array> {
  const b64 = process.env.EET_PLAYGROUND_RESPONSE_CERT_B64?.trim();
  if (b64) {
    return Uint8Array.from(Buffer.from(b64, "base64"));
  }
  const filePath = process.env.EET_PLAYGROUND_RESPONSE_CERT_PATH?.trim();
  if (filePath) {
    const buf = await readFile(filePath);
    return new Uint8Array(buf);
  }
  throw new Error(
    "Chybí certifikát pro ověření odpovědi playground EET. Nastavte v Coolify proměnnou EET_PLAYGROUND_RESPONSE_CERT_B64 (DER, base64) nebo EET_PLAYGROUND_RESPONSE_CERT_PATH."
  );
}

export async function getPlaygroundResponseVerifier(): Promise<ResponseSignatureVerifier> {
  if (cachedPlaygroundVerifier) return cachedPlaygroundVerifier;
  const der = await loadPlaygroundResponseCertDer();
  cachedPlaygroundVerifier = createCryptoKeyResponseSignatureVerifier(der, der);
  return cachedPlaygroundVerifier;
}
