# CvakniTO — HANDOFF (stav MVP)

**Verze aplikace:** `1.27` (`lib/version.ts`)  
**Repo:** `https://github.com/jiricendelin/APP_CvakniTO`  
**Produkce:** `https://cvaknito.cendelin.cz`  
**Zdroj řezů:** `source/rezy.md` · **Zadání:** `source/zadani.md`

---

## Shrnutí

MVP z `rezy.md` je v kódu **hotové** (Fáze 1–4). Zbývají **manuální kroky** na Coolify/VPS, n8n ingest, fyzický test tisku a volitelně rozšíření testu izolace tenantů (R25).

---

## Hotové řezy (pushnuté)

| Verze | Řez | Poznámka |
|-------|-----|----------|
| 1.00–1.14 | R1–R18 | Kostra, deploy, auth, pokladna, účtenky, tisk (kód), faktury, SMTP |
| **1.15** | R19 | E-mail faktury / upomínky / poděkování — `/settings/email-templates` |
| **1.16** | R20 | `POST /api/bank/ingest`, tabulka `payments`, `/payments` |
| **1.17** | R23 + R25 (základ) | `/reports`, `GET /api/reports/export`, `npm run test:tenant-isolation` |
| **1.18** | R21–R24 | EET: `/settings/eet`, odeslání, auto po zaplacení, storno, opravná účtenka |
| **1.23** | Poukazy | Dárkové poukazy (`/vouchers`), zákazníci DP + storno poplatky (`/gift-customers`), e-mail účtenky, podpis + IMAP kopie, denní cron (`/api/cron/daily`). Platby: účtenka zaplacená až při součtu plateb ≥ částka, ruční přiřazení platby v `/payments` a v detailu poukazu, QR účtenky EET až po zaplacení. |
| **1.24** | PDF poukazu | A4 na výšku: přední + zadní strana DL (200 × 95 mm) pod sebou, dělicí čára, stříhací čára 5 mm pod zadní stranou. Oprava centrování čísla/platnosti, PNG i JPG. |
| **1.25** | Účtenky DP | Editace položek a platby, ruční uhrazení, e-mail do QDP, obdarovaný u poukazu, stažení PDF účtenky. |
| **1.26** | Mail | Odeslání účtenky bez Application error; IMAP kopie do Odeslané je stejná zpráva včetně PDF (poukazy). |
| **1.27** | Mail | Odeslání účtenky e-mailem přes API routu (ne server action) — digest / Application error. |

### Provoz pro 1.23 (hotovo 2026-11-05)

- `CRON_SECRET` v Coolify; n8n denní workflow 7:00 `Europe/Prague` (sdílený trigger s WTime, větve s On Error: Continue) → `POST http://cvaknito-app:3000/api/cron/daily`, Header Auth `Authorization: Bearer <CRON_SECRET>`.
- Persistent volume `cvaknito-data` → `/data` (pokrývá `/data/vouchers` i `/data/eet`); env `VOUCHER_ART_DIR=/data/vouchers`, `EET_DATA_DIR=/data/eet`. Bez env by aplikace ukládala do `/app/data/...` mimo volume.

### PDF poukazu — jak upravovat (1.24)

- **Layout:** `lib/vouchers/pdf/voucher-pdf-document.tsx` — konstanty v mm nahoře (`CARD_*`, `FRONT_TOP`, `BACK_TOP`, `CUT_TOP`). Zadní strana se **neotáčí**.
- **Číslo a platnost:** pozice v % **zadní strany** z nastavení (`voucherNumberX/Y`, `voucherValidX/Y`), text je vycentrovaný na daný bod přes `overlayPosition()`. Nepoužívat `transform: translate(-50%, …)` — v `@react-pdf` necentruje.
- **Obrázky:** `lib/vouchers/pdf/render-voucher-pdf.tsx` předává `Buffer`, formát (JPG/PNG) pozná `@react-pdf` z obsahu. Grafika: DL na šířku, ideálně 2480 × 1181 px, RGB, max 5 MB. Upload: Nastavení → Grafika poukazu (`components/settings/voucher-art-form.tsx`).
- **Font:** Roboto (viz níže „PDF a font“). Nepoužívat vestavěnou Helveticu — neumí č/ř/ě/ů/ň/ť/ď.
- **Lokální náhled PDF:** `tsx` s `@react-pdf` padá (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Funguje: skript v `.tmp/` → `npx esbuild <skript>.tsx --bundle --platform=node --format=esm --packages=external --jsx=automatic --outfile=.tmp/x.mjs` → `node .tmp/x.mjs`. Ověřit vždy vizuálně, ne jen buildem.
- **Neověřeno:** výchozí pozice textů vůči skutečné grafice a tisk na papír — doladit po prvním zkušebním poukazu.

### PDF účtenky + font (v 1.25)

- **Font ve všech PDF:** Roboto z `public/fonts/` (Regular + Bold), registrace `registerInvoicePdfFonts()` v `lib/invoices/pdf/register-fonts.ts` — volá se v rendererech faktury, účtenky (`lib/receipts/pdf/render-receipt-pdf.tsx`) i poukazu (`lib/vouchers/pdf/render-voucher-pdf.tsx`); dokumenty mají `fontFamily: "Roboto"`. Nový PDF dokument = zavolat registraci + nastavit `fontFamily`. Ověřeno lokálním náhledem (diakritika v názvu firmy, adrese, položkách, tučné „Celkem“, fallback poukazu).
- **Stažení PDF účtenky:** `GET /api/receipts/[id]/pdf` (`app/api/receipts/[id]/pdf/route.ts`, vzor podle faktur). Tlačítko „Stáhnout PDF“ v detailu účtenky (`components/receipts/receipt-detail.tsx`).
- **Přepínač:** Nastavení → Šablona účtenky → „Zobrazovat v detailu účtenky tlačítko Stáhnout PDF“ (`receiptPdfDownload` v `tenantSettingsSchema`, výchozí zapnuto; ukládá se s šablonou v `app/(app)/settings/receipt-template/actions.ts`). Skrývá jen tlačítko, endpoint funguje dál.
- **Neověřeno:** klik na tlačítko v běžící aplikaci (stažení přes přihlášenou session) a uložení přepínače — ověřit po deployi.
- **Náhled PDF lokálně:** `.tmp/font-preview.tsx` (účtenka + poukaz s českými znaky) → esbuild jako výše → `python -m http.server 8765 --directory .tmp` → `http://localhost:8765/view.html?f=receipt-font.pdf&s=1.3` (pdf.js z CDN). `.tmp/` je v `.gitignore`.

### Na později (z review 1.23)

- Cron autorizace jen POST + Bearer (zrušit `?token=`) — nejdřív ověřit, jak je cron nastavený v n8n.
- Ruční přiřazení platby k **faktuře**.

---

## Co je potřeba udělat na provozu (Jirka)

### 1. Coolify — environment

Kromě už nastavených (`DATABASE_URL`, `SESSION_SECRET`, SMTP v DB, …):

| Proměnná | Účel |
|----------|------|
| `BANK_INGEST_TOKEN` | Bearer pro `POST /api/bank/ingest` (n8n / FIO) |
| `EET_DATA_DIR` | Např. `/data/eet` — uložiště `.p12` mimo webroot |
| `EET_PLAYGROUND_RESPONSE_CERT_B64` | DER certifikát pro **ověření podpisu odpovědi** playground EET (base64). Bez něj odeslání na playground skončí chybou podpisu odpovědi. Alternativa: `EET_PLAYGROUND_RESPONSE_CERT_PATH` (cesta k souboru v kontejneru). |

### 2. Coolify — volume EET

- Připojit **persistent volume** na cestu odpovídající `EET_DATA_DIR` (typicky `/data/eet`).
- Certifikáty se ukládají jako `{tenantId}.p12` — **nepřežijí redeploy bez volume**.
- Stažení `.p12` přes web **není** (soubor není ve `public`).

### 3. Databáze po deployi

Entrypoint používá `prisma db push` (ne `migrate deploy`). Po nasazení verze **≥ 1.16** musí v DB existovat:

- tabulka `payments`, sloupec `receipts.paid_at` (R20),
- tabulka `eet_records`, sloupce `receipts.eet_pok`, `eet_bkp`, `eet_pkp`, `storned_at`, `corrects_receipt_id` (R21–R24).

Ověření: v logu kontejneru „DB schema OK“, nebo ručně v Postgres.

### 4. n8n — příjem plateb (R20)

- Workflow volá **`POST http://cvaknito-app:3000/api/bank/ingest`** (interní síť Docker/Coolify).
- Header: `Authorization: Bearer <BANK_INGEST_TOKEN>`.
- Payload: stejný koncept jako WTime (`tenantId`, `moveId`, `variableSymbol`, `amountCents`, …).
- Dedup podle `[tenantId, moveId]`.

### 5. EET Playground (R21–R22)

1. Nastavení → **EET 2.0** — nahrát playground `.p12` + heslo, ID provozovny a pokladny.
2. Nastavit certifikát odpovědi (env výše).
3. V detailu účtenky **Odeslat do EET**, případně zapnout **automaticky po zaplacení**.
4. **Produkční EET endpoint** v aplikaci zatím není — jen playground (`eetPlayground` v nastavení).

### 6. Fyzický tisk (R6 / R15)

- Spike `/dev/print` (Web Serial) — ověření diakritiky + QR **na telefonu s tiskárnou** není součástí CI.
- R15 napojuje šablonu účtenky na tisk — závisí na výsledku R6.

---

## Co není / omezení

| Položka | Stav |
|---------|------|
| **R25 plné kritérium** | Doplněno skriptem `npm run test:tenant-isolation-http` (viz Lokální příkazy) — potřebuje ověřit reálným během, zatím jen build+lint. |
| **BKP / PKP na účtence** | Ukládá se hlavně **POK** z odpovědi; BKP/PKP v DB zatím prázdné. |
| **Registrace uživatelů v UI** | Jen `npm run create-user` (viz `rezy.md` „Na později“). |
| **Přehledy** | Účtenky se stavem `stornovano` se **ne počítají** do součtů. |
| **Spodní navigace** | 7 položek (včetně Platby) — grid dynamický, na úzkém displeji může být těsné. |

---

## Užitečné cesty v aplikaci

| Cesta | Účel |
|-------|------|
| `/` | Pokladna |
| `/receipts`, `/invoices`, `/customers` | Seznamy |
| `/payments` | Bankovní platby (spárované / nespárované) |
| `/reports` | Přehledy + export CSV |
| `/settings/eet` | Certifikát a parametry EET |
| `/settings/smtp`, `/settings/email-templates` | Mail |
| `/api/health` | `{ ok, version }` |
| `/api/bank/ingest` | Ingest plateb (Bearer token) |

---

## Lokální příkazy

```bash
npm run build
npm run lint
npm run test:tenant-isolation   # potřebuje DB + ≥2 tenanty
npm run test:tenant-isolation-http   # potřebuje běžící "npm run dev" + DB (plné R25, testuje přes HTTP/URL)
npm run create-user -- email heslo [tenant]
```

---

## Kontrolní body deploy (dle `rezy.md`)

Po R6, R15, R20, R23, R25 — nasazení a ověření na produkci **jen na pokyn „nasaď“**.  
Aktuální stav kódu: R20, R23, R25 (základ), R21–R24 pushnuté; chybí provozní dokončení výše.

---

*Poslední aktualizace handoffu: 2026-11-09 (verze 1.27).*
