import { X509Certificate } from "node:crypto";
import {
  parsePkcs12,
  pickPrivateKeyCertificate,
} from "@finitoapp/eet-client/pkcs12";

export type ParsedEetCertInfo = {
  subject: string;
  validTo: string;
  taxpayerId: string;
};

function taxpayerIdFromSubject(subject: string): string {
  const match = subject.match(/(?:^|\s)CN=([^,\n]+)/i);
  const cn = match?.[1]?.trim() ?? "";
  if (/^CZ[0-9]{8,10}$/.test(cn)) return cn;
  const digits = cn.replace(/\D/g, "");
  if (digits.length >= 8) return `CZ${digits.slice(0, 10)}`;
  return "";
}

export async function readCertInfoFromP12(
  p12Bytes: Uint8Array,
  password: string
): Promise<
  | { ok: true; info: ParsedEetCertInfo }
  | { ok: false; error: "wrong_password" | "invalid" | "missing_key" }
> {
  const parsed = await parsePkcs12(p12Bytes, password);
  if (!parsed.ok) {
    if (parsed.error.type === "Pkcs12InvalidMacError") {
      return { ok: false, error: "wrong_password" };
    }
    return { ok: false, error: "invalid" };
  }
  const certificate = pickPrivateKeyCertificate(parsed.value);
  if (certificate === undefined || parsed.value.privateKey === undefined) {
    return { ok: false, error: "missing_key" };
  }
  const x509 = new X509Certificate(certificate.der);
  const subject = x509.subject;
  return {
    ok: true,
    info: {
      subject,
      validTo: x509.validTo,
      taxpayerId: taxpayerIdFromSubject(subject),
    },
  };
}
