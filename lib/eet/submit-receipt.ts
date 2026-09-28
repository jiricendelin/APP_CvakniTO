import {
  createEetClient,
  EetEndpoint,
  isOk,
  type Uuid,
} from "@finitoapp/eet-client";
import { parseEetReceiptData } from "@finitoapp/eet-client/builtin";
import { prisma } from "@/lib/prisma";
import { getTenantSettings } from "@/lib/settings/repository";
import { decryptSecret } from "@/lib/crypto/encrypt-secret";
import { tenantCertExists } from "@/lib/eet/cert-path";
import {
  centsToEetAmount,
  dateToEetDateTime,
  receiptNumberToPoradCis,
} from "@/lib/eet/format-receipt";
import { loadSignerFromP12 } from "@/lib/eet/load-signer";
import { getPlaygroundResponseVerifier } from "@/lib/eet/response-verifier";
import { formatEetError, formatEetRejected } from "@/lib/eet/errors";
import type { EetSettings } from "@/lib/eet/settings-schema";

export type SubmitEetResult =
  | { ok: true; pok: string; messageUuid: string }
  | { ok: false; error: string };

function resolveEetConfig(settings: EetSettings & Record<string, unknown>) {
  const premiseId = settings.eetPremiseId?.trim();
  const registerId = settings.eetRegisterId?.trim();
  const taxpayerId = settings.eetTaxpayerId?.trim();
  const passwordEnc = settings.eetCertPasswordEnc?.trim();
  if (!premiseId || !registerId || !taxpayerId || !passwordEnc) {
    return null;
  }
  return { premiseId, registerId, taxpayerId, passwordEnc };
}

export async function submitReceiptToEet(
  tenantId: string,
  receiptId: string,
  options?: { storno?: boolean; firstSubmission?: boolean }
): Promise<SubmitEetResult> {
  const storno = options?.storno === true;

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, tenantId },
    include: { items: true },
  });
  if (!receipt) {
    return { ok: false, error: "Účtenka nenalezena." };
  }
  if (receipt.eetStatus === "stornovano" && !storno) {
    return { ok: false, error: "Účtenka je stornovaná." };
  }
  if (receipt.eetStatus === "odeslano" && !storno) {
    return { ok: false, error: "Účtenka už byla odeslaná do EET." };
  }

  if (!(await tenantCertExists(tenantId))) {
    return { ok: false, error: "Nahrajte certifikát EET v Nastavení." };
  }

  const settings = await getTenantSettings(tenantId);
  const cfg = resolveEetConfig(settings);
  if (!cfg) {
    return {
      ok: false,
      error: "Doplňte provozovnu, pokladnu a certifikát v Nastavení EET.",
    };
  }

  if (!settings.eetPlayground) {
    return {
      ok: false,
      error: "Produkční EET endpoint zatím není v aplikaci nastaven.",
    };
  }

  const priorOk = await prisma.eetRecord.findFirst({
    where: { tenantId, receiptId, status: "accepted", kind: storno ? "storno" : "sale" },
    orderBy: { createdAt: "desc" },
  });

  let firstSubmission = options?.firstSubmission ?? true;
  let messageUuid = priorOk?.messageUuid;

  if (priorOk && !storno) {
    firstSubmission = false;
    messageUuid = priorOk.messageUuid;
  }

  const totalCents = storno ? -receipt.totalCents : receipt.totalCents;

  const receiptInput = {
    eic_popl: cfg.taxpayerId,
    id_jednotky: cfg.premiseId,
    id_pokl: cfg.registerId,
    porad_cis: receiptNumberToPoradCis(receipt.number),
    dat_trzby: dateToEetDateTime(receipt.createdAt),
    celk_trzba: centsToEetAmount(totalCents),
  };

  const parsedReceipt = parseEetReceiptData(receiptInput);
  if (!parsedReceipt.ok) {
    return {
      ok: false,
      error: formatEetError(parsedReceipt.error),
    };
  }

  let password: string;
  try {
    password = decryptSecret(cfg.passwordEnc);
  } catch {
    return { ok: false, error: "Nelze dešifrovat heslo certifikátu." };
  }

  let signer;
  try {
    signer = await loadSignerFromP12(tenantId, password);
  } catch (e) {
    return { ok: false, error: formatEetError(e) };
  }

  let responseVerifier;
  try {
    responseVerifier = await getPlaygroundResponseVerifier();
  } catch (e) {
    return { ok: false, error: formatEetError(e) };
  }

  const client = createEetClient({
    endpoint: EetEndpoint.playground,
    signer,
    responseSignatureVerifier: responseVerifier,
    timeoutMs: 45_000,
  });

  const submitOptions: { firstSubmission: boolean; uuid?: Uuid } = {
    firstSubmission,
  };
  if (messageUuid) {
    submitOptions.uuid = messageUuid as Uuid;
  }

  const result = await client.submit(parsedReceipt.value, submitOptions);

  if (!isOk(result)) {
    const msg = formatEetError(result.error);
    await prisma.eetRecord.create({
      data: {
        tenantId,
        receiptId,
        messageUuid: crypto.randomUUID(),
        status: "error",
        errorMessage: msg,
        kind: storno ? "storno" : "sale",
      },
    });
    if (!storno) {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { eetStatus: "chyba" },
      });
    }
    return { ok: false, error: msg };
  }

  const outcome = result.value;

  if (outcome.status === "rejected") {
    const msg = formatEetRejected(outcome.code, outcome.message);
    await prisma.eetRecord.create({
      data: {
        tenantId,
        receiptId,
        messageUuid: outcome.uuid ?? crypto.randomUUID(),
        status: "rejected",
        errorMessage: msg,
        kind: storno ? "storno" : "sale",
      },
    });
    if (!storno) {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { eetStatus: "chyba" },
      });
    }
    return { ok: false, error: msg };
  }

  if (outcome.status !== "accepted") {
    return { ok: false, error: "EET vrátilo ověřovací režim — neočekávaný stav." };
  }

  const pok = outcome.pok;
  const uuid = outcome.uuid;

  await prisma.$transaction(async (tx) => {
    await tx.eetRecord.create({
      data: {
        tenantId,
        receiptId,
        messageUuid: uuid,
        pok,
        status: "accepted",
        kind: storno ? "storno" : "sale",
      },
    });
    if (storno) {
      await tx.receipt.update({
        where: { id: receiptId },
        data: {
          eetStatus: "stornovano",
          stornedAt: new Date(),
          eetPok: pok,
        },
      });
    } else {
      await tx.receipt.update({
        where: { id: receiptId },
        data: {
          eetStatus: "odeslano",
          eetPok: pok,
        },
      });
    }
  });

  return { ok: true, pok, messageUuid: uuid };
}

/** Pro automatické odeslání po zaplacení — chyby jen loguje, neblokuje účtenku. */
export async function tryAutoSendReceiptToEet(
  tenantId: string,
  receiptId: string
): Promise<void> {
  const settings = await getTenantSettings(tenantId);
  if (!settings.eetAutoSend) return;
  await submitReceiptToEet(tenantId, receiptId);
}
