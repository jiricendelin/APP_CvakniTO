import { readFile } from "node:fs/promises";
import { createCryptoKeySigner } from "@finitoapp/eet-client";
import type { EetSigner } from "@finitoapp/eet-client";
import {
  parsePkcs12,
  pickPrivateKeyCertificate,
} from "@finitoapp/eet-client/pkcs12";
import { getTenantCertPath } from "@/lib/eet/cert-path";

export async function loadSignerFromP12(
  tenantId: string,
  password: string
): Promise<EetSigner> {
  const p12 = new Uint8Array(await readFile(getTenantCertPath(tenantId)));
  const parsed = await parsePkcs12(p12, password);
  if (!parsed.ok) {
    if (parsed.error.type === "Pkcs12InvalidMacError") {
      throw new Error("Heslo k certifikátu EET není správné.");
    }
    throw new Error("Certifikát EET (.p12) nelze načíst.");
  }
  const certificate = pickPrivateKeyCertificate(parsed.value);
  if (certificate === undefined || parsed.value.privateKey === undefined) {
    throw new Error("V certifikátu chybí privátní klíč.");
  }
  const keyDer = Buffer.from(parsed.value.privateKey.der);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return createCryptoKeySigner(certificate.der, privateKey);
}
