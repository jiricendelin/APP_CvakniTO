import { isEetError } from "@finitoapp/eet-client";

export function formatEetError(error: unknown): string {
  if (isEetError(error, "EetValidationError")) {
    return `Neplatná data pro EET: ${error.message}`;
  }
  if (isEetError(error, "EetNetworkError")) {
    return "EET: síťová chyba — zkontrolujte připojení k internetu.";
  }
  if (isEetError(error, "EetTimeoutError")) {
    return "EET: vypršel časový limit odpovědi.";
  }
  if (isEetError(error, "EetSignatureError")) {
    return "EET: nepodařilo se ověřit podpis odpovědi (certifikát odpovědi?).";
  }
  if (isEetError(error, "EetSoapFaultError")) {
    return `EET SOAP: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return "Neznámá chyba EET.";
}

export function formatEetRejected(code: number, message: string): string {
  return `EET odmítlo zprávu (${code}): ${message}`;
}
