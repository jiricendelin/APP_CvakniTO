import { isValidIcoFormat, normalizeIco } from "./ico";

export type AresSubject = {
  ico: string;
  name: string;
  dic: string;
  address: string;
};

type AresApiResponse = {
  ico?: string;
  obchodniJmeno?: string;
  dic?: string;
  sidlo?: {
    textovaAdresa?: string;
  };
};

export type FetchAresResult =
  | { ok: true; subject: AresSubject }
  | { ok: false; error: string };

export async function fetchAresSubjectByIco(
  icoRaw: string
): Promise<FetchAresResult> {
  const ico = normalizeIco(icoRaw);
  if (!isValidIcoFormat(ico)) {
    return { ok: false, error: "Zadejte platné IČO (8 číslic)." };
  }

  const url = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
  } catch {
    return { ok: false, error: "ARES není dostupný. Zkuste to později." };
  }

  if (response.status === 404) {
    return { ok: false, error: "Subjekt s tímto IČO v ARES nebyl nalezen." };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `ARES vrátil chybu (${response.status}).`,
    };
  }

  let data: AresApiResponse;
  try {
    data = (await response.json()) as AresApiResponse;
  } catch {
    return { ok: false, error: "Neplatná odpověď z ARES." };
  }

  const name = data.obchodniJmeno?.trim();
  if (!name) {
    return { ok: false, error: "ARES nevrátil název subjektu." };
  }

  return {
    ok: true,
    subject: {
      ico: data.ico ?? ico,
      name,
      dic: data.dic?.trim() ?? "",
      address: data.sidlo?.textovaAdresa?.trim() ?? "",
    },
  };
}
