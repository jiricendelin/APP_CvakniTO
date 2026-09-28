# CvakniTO — řezy pro Composer

Zdroj: `zadani.md` + plán `cvaknito_pokladní_app_56199c63.plan.md` (doplněný o mezery z revize).
Jeden řez = jeden chat v Composeru. Na začátku chatu mu dej: tento soubor, `zadani.md` a číslo řezu.

## Zásady pro všechny řezy

- Stack jako WTime (`C:\Users\jiric\Projekty\WTime`): Next.js 15 App Router, PostgreSQL 16, Prisma, Tailwind. Před psaním paralelního řešení se podívej, jak to má WTime.
- Každá tabulka (kromě `tenants`) má `tenant_id`; každý dotaz filtruje přes helper `getTenantId()` ze session (vzniká v R4).
- Peníze jako `Int` v haléřích; zobrazení `1 750,00 Kč` (desetinná čárka); čas `Europe/Prague`.
- Položky účtenky/faktury = snapshot (název, cena, kategorie v okamžiku prodeje), ne jen odkaz na ceník.
- Kategorie: `masaze` | `pedikura` | `ostatni` — nese je **položka**, ne celá účtenka (smíšený košík).
- UI česky, mobil first (375 px bez horizontálního scrollu), vizuál jako WTime, primární barva `--color-primary`.
- `APP_VERSION` v `lib/version.ts` od `1.00`, bump +0.01 jen při pushi. Commit/push/deploy jen na Jirkův pokyn.
- Řez je hotový, až projde `npm run build` + `npm run lint` a všechna kritéria níže.

---

## 0 — Prerekvizity (Jirka, ne Composer)

- Tiskárna: Cashino PTP-II (nebo klon), 58 mm, ESC/POS, Bluetooth V2.0 (klasický SPP) nebo V4.0 (dual). Spárovat v Android nastavení Bluetooth (PIN `0000`). Autotest (podržet FEED při zapnutí) ukáže verzi Bluetooth a znakové sady.
- Chrome na Androidu ve verzi **138+** (Web Serial přes Bluetooth SPP).
- Testovací certifikáty Playground (`CAEET_Playground_2026_v1.zip`) z [eet.gov.cz](https://eet.gov.cz/cs/pro-vyvojare).
- DNS záznam `cvaknito.cendelin.cz` (Cloudflare, DNS only pro první certifikát).

**Hotovo:** tiskárna spárovaná s telefonem, fotka autotestu k dispozici, Chrome 138+, zip s certifikáty stažený, DNS záznam existuje.

---

## Fáze 1 — Základ

### R1 — Kostra projektu
Next.js 15 + Tailwind + Prisma (zatím prázdné schéma + `tenants`), `lib/version.ts` = `1.00`, Dockerfile (port 3000) podle WTime, `GET /api/health` vrací `{ ok, version }`.

**Hotovo:** `npm run build` a `docker build .` projdou; lokálně `GET /api/health` → 200 s `version: "1.00"`.

### R2 — Deploy na Coolify (Jirka krok po kroku, Composer jen asistuje)
Postgres jako samostatný resource, App = **Dockerfile** (ne Compose), doména bez sslip.io, Custom Container Name `cvaknito-app` + Predefined Network.

**Hotovo:** `https://cvaknito.cendelin.cz/api/health` → 200 s platným certifikátem; na VPS `docker ps -a` neukazuje sirotka s uuid jménem.

### R3 — Schéma základu + seed
Tabulky `tenants`, `users`, `settings` (JSON per tenant), `sequences`. Seed: 1 tenant.

**Hotovo:** `prisma migrate dev` projde od nuly; `prisma db seed` vytvoří tenant; `prisma validate` bez chyb.

### R4 — Přihlášení
Login stránka, session (iron-session jako WTime), middleware chrání vše kromě `/login` a `/api/health` a `/api/bank/*`, skript `npm run create-user -- email heslo [tenant]`, helper `getTenantId()`.

**Hotovo:** nepřihlášený → redirect na `/login`; skript vytvoří uživatele; přihlášení projde, špatné heslo ukáže českou hlášku; odhlášení funguje.

### R5 — Layout, navigace, PWA
Spodní navigace (Pokladna, Účtenky, Faktury, Zákazníci, Přehledy, Nastavení), styl WTime, zelená `--color-primary`, `manifest.webmanifest` + ikony.

**Hotovo:** v Chrome na Androidu jde „Přidat na plochu“ a appka se otevře bez adresního řádku; všechny položky navigace vedou na (zatím prázdné) stránky; 375 px bez horizontálního scrollu.

### R6 — Tisk: spike (udělat co nejdřív, klidně hned po R2)
Samostatná testovací stránka `/dev/print`: připojení spárované tiskárny přes **Web Serial** (`navigator.serial.requestPort()`, Bluetooth SPP, Chrome Android 138+); Web Bluetooth (BLE) jen jako záloha, pokud tiskárna SPP nenabídne. Tisk věty „Příliš žluťoučký kůň úpěl ďábelské ódy“ dvěma cestami:
1. text ESC/POS s kódovou stránkou CP852 (`ESC t n` — číslo stránky z autotestu),
2. rastr (text vykreslený do canvasu 384 px šířky → `GS v 0`).
Plus QR kód (nativní ESC/POS `GS ( k`, případně rastr).

**Hotovo (Jirka fyzicky):** z telefonu se vytiskne věta se správnou diakritikou aspoň jednou cestou + čitelný QR; zapsáno, která cesta se použije v R15.

---

## Fáze 2 — Pokladna a účtenky

### R7 — Nastavení I: firma, platba, barva
Stránka `/settings`: firma (název, IČO, DIČ, adresa), bankovní účet/IBAN, primární barva. Uložení do `settings` JSON.

**Hotovo:** data se uloží a po reloadu načtou; neplatný IBAN se neuloží (česká hláška); změna barvy se projeví v celé aplikaci.

### R8 — Ceník
Tabulka `price_items` (název, cena, kategorie, aktivní, pořadí). CRUD na `/settings/pricelist`. Seed: položky ze zadání (Masáž 800, Masáž dva 1000, Masáž tři 1500, Pedikúra 600, Pedikúra s lakováním 700).

**Hotovo:** přidat / upravit / deaktivovat položku; kategorie povinná; neaktivní položka se nenabízí v pokladně (ověří se v R10).

### R9 — Číselné řady
`sequences` pro účtenky a faktury: prefix, formát (např. `{YYYY}{NNNN}`), reset po roce, atomické přidělení v transakci. UI v Nastavení.

**Hotovo:** test — 20 paralelních přidělení dá 20 různých po sobě jdoucích čísel; změna formátu se projeví u dalšího čísla; nový rok začne od 1.

### R10 — Pokladna UI
`/`: mřížka aktivních položek (velká tlačítka), počet, numerická klávesnice, neceníková položka (název + cena + kategorie), košík s úpravou/odebráním, součet. Zatím bez ukládání.

**Hotovo:** scénář 2× Masáž (800) + neceníková 150 Kč → součet `1 750,00 Kč`; klávesnice ovladatelná palcem; neaktivní položka chybí.

### R11 — Uložení účtenky
Tabulky `receipts` + `receipt_items`. Velká tlačítka „Hotově“ / „QR“, přepínač „Tisknout“ (zapamatovaný). Číslo z řady, VS = číselná podoba čísla účtenky, stav EET `neodeslano`.

**Hotovo:** po zaplacení je účtenka v DB se snapshotem položek, košík se vyprázdní a zobrazí se detail; VS je unikátní v rámci tenanta.

### R12 — SPAYD QR
`lib/spayd.ts` (IBAN, částka, VS, zpráva). Zobrazení na obrazovce po volbě „QR“ a v detailu účtenky.

**Hotovo:** unit test SPAYD řetězce proti ručně spočítanému vzoru; naskenování bankovní aplikací ukáže správný účet, částku a VS.

### R13 — Seznam účtenek, detail, editace, smazání
`/receipts`: filtr datum od–do, kategorie (účtenka obsahuje položku kategorie), typ platby; detail; editace a smazání **jen dokud není odeslaná do EET** (po odeslání jen storno — R24).

**Hotovo:** filtry jdou kombinovat a sedí s daty; editace přepočítá součet; smazání s potvrzovacím dialogem; u odeslané účtenky jsou Upravit/Smazat skryté.

### R14 — Šablona účtenky + náhled (Nastavení II)
Handlebars šablona v `settings`, seznam proměnných v UI (firma, číslo, datum, položky, součet, platba, QR, EET kódy), živý náhled na ukázkových datech. Šířka 58 mm (48 mm tisknutelných, 32 znaků na řádek / 384 px).

**Hotovo:** změna šablony se hned ukáže v náhledu; neplatná šablona se neuloží a ukáže chybu; výchozí šablona obsahuje vše povinné.

### R15 — Tisk účtenky
Napojení cesty z R6 na šablonu z R14: tisk po zaplacení (když je zapnutý přepínač) a „Vytisknout znovu“ v detailu. Zapamatování tiskárny, srozumitelná hláška, když není připojená. Při QR platbě je QR na účtence.

**Hotovo (Jirka fyzicky):** po zaplacení s přepínačem se účtenka vytiskne; opakovaný tisk z detailu funguje; bez tiskárny se účtenka uloží a zobrazí hlášku (žádná ztráta dat).

---

## Fáze 3 — Faktury a platby

### R16 — Zákazníci + ARES
Tabulka `customers`, CRUD `/customers`, tlačítko „Načíst z ARES“ → `GET /api/ares/[ico]` (kopie `WTime/lib/ares.ts`).

**Hotovo:** IČO existující firmy doplní název, adresu a DIČ; neexistující IČO ukáže hlášku; zákazník jde upravit a smazat.

### R17 — Faktury: tvorba + PDF
Tabulky `invoices` + `invoice_items` (s kategorií), stav `koncept/odeslana/zaplacena/po_splatnosti`, číslo z řady, VS, splatnost. PDF přes `@react-pdf/renderer` s embedovaným fontem s diakritikou + SPAYD QR.

**Hotovo:** faktura se vytvoří s výběrem zákazníka; PDF ke stažení má správnou diakritiku, součty a QR, které banka načte.

### R18 — Nastavení III: SMTP
Host, port, šifrování (SSL 465 / STARTTLS 587), uživatel, heslo, odesílatel. Tlačítko „Poslat testovací e-mail“.

**Hotovo:** testovací e-mail dorazí; při chybě se ukáže srozumitelná hláška se SMTP chybou.

### R19 — Odeslání faktury, upomínky, poděkování
Šablony e-mailů (předmět + HTML + text) pro fakturu, upomínku a poděkování v Nastavení; odeslání přes `nodemailer` s PDF v příloze; ruční tlačítka u faktury.

**Hotovo:** faktura dorazí s PDF a stav přejde na `odeslana`; upomínka a poděkování dorazí s vyplněnými proměnnými.

### R20 — Příjem plateb z n8n
Tabulka `payments`. `POST /api/bank/ingest` (Bearer `BANK_INGEST_TOKEN`, formát payloadu jako WTime). Párování podle VS na účtenku nebo fakturu → stav zaplaceno; nespárované platby se uloží a zobrazí. Dedup podle ID pohybu z FIO.

**Hotovo:** `curl` se vzorovým payloadem spáruje účtenku i fakturu; neznámý VS skončí v nespárovaných; stejný payload podruhé nic neduplikuje; bez tokenu → 401.
Pak Jirka: n8n workflow na `http://cvaknito-app:3000/api/bank/ingest` → skutečná platba z FIO se spáruje.

---

## Fáze 4 — EET 2.0 a přehledy

### R21 — EET: nastavení a certifikát
Upload `.p12` + heslo, ID provozovny, ID pokladny, přepínač Playground/produkce. Soubor do Docker volume mimo webroot, heslo šifrovaně.

**Hotovo:** po nahrání playground certifikátu appka ukáže CN (DIČ) a platnost do; certifikát přežije redeploy (volume); stažení souboru přes web není možné.

### R22 — EET: odeslání tržby
`@finitoapp/eet-client` (SOAP v4.1, podpis, ověření odpovědi) server-side. Tabulka `eet_records` (uuid zprávy, BKP, PKP, POK, stav, chyba). Tlačítko „Odeslat do EET“ + automaticky po zaplacení (dle nastavení). **Bez automatického opakování** — server nededuplikuje, opakování jen ručně.

**Hotovo:** účtenka odeslaná na Playground dostane potvrzení; kódy jsou v detailu i na tisku; chyba se uloží a ukáže česky; opakování jde jen ručně.

### R23 — Přehledy + CSV
`/reports`: období, kategorie, typ platby; součty po kategoriích (kvůli paušálu) z položek účtenek i zaplacených faktur. Export CSV: UTF-8 s BOM, středník, desetinná čárka.

**Hotovo:** součty sedí s ručním součtem v DB; CSV se otevře v Excelu s diakritikou a čísly jako čísla.

### R24 — EET: storno / oprava
Podle specifikace v4.1 (EET neumí záznam smazat — ověřit, jestli storno = nová zpráva se zápornou tržbou). Editace odeslané účtenky = storno + nová účtenka.

**Hotovo:** Playground přijme stornovací zprávu; účtenka má stav `stornovano` a odkaz na opravnou; přehledy storno započítají.

### R25 — Ověření izolace více uživatelů
`create-user` s novým tenantem; test, že každé API a stránka vrací jen data vlastního tenanta.

**Hotovo:** automatický test — uživatel B nevidí ani přes přímou URL/ID žádnou účtenku, fakturu, zákazníka, platbu ani nastavení uživatele A.

---

## Kontrolní body pro deploy (jen na pokyn „nasaď“)
Po R6, R15, R20, R23, R25.

## Na později (mimo MVP)
- Registrační flow / správa uživatelů v UI (teď jen skript).
- Automatická obnova EET certifikátu přes CA EET REST API (certifikát platí 366 dní).
