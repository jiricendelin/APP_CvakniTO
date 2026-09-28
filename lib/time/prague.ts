function pragueParts(date: Date, withMinutes = false) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: withMinutes ? "2-digit" : undefined,
    second: withMinutes ? "2-digit" : undefined,
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const base = {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
  if (!withMinutes) return base;
  return {
    ...base,
    minute: get("minute"),
    second: get("second"),
  };
}

/** ISO 8601 s offsetem pro EET (`dat_trzby`). */
export function formatPragueIsoDateTime(date: Date): string {
  const p = pragueParts(date, true) as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  const localAsUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second
  );
  const offsetMin = Math.round((localAsUtc - date.getTime()) / 60_000);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${sign}${pad(oh)}:${pad(om)}`;
}

/** Kalendářní den YYYY-MM-DD → začátek dne v UTC (Europe/Prague). */
export function pragueStartOfDayUtc(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10);
  const d = parseInt(m[3]!, 10);

  for (let h = -36; h <= 36; h++) {
    const candidate = new Date(Date.UTC(y, mo - 1, d, h, 0, 0, 0));
    const p = pragueParts(candidate);
    if (p.year === y && p.month === mo && p.day === d && p.hour === 0) {
      return candidate;
    }
  }
  return null;
}

/** Konec dne (exclusive) pro filtr createdAt < end. */
export function pragueEndExclusiveUtc(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = parseInt(m[1]!, 10);
  const mo = parseInt(m[2]!, 10);
  const d = parseInt(m[3]!, 10);
  const next = new Date(Date.UTC(y, mo - 1, d + 1));
  const ny = next.getUTCFullYear();
  const nmo = next.getUTCMonth() + 1;
  const nd = next.getUTCDate();
  return pragueStartOfDayUtc(
    `${ny}-${String(nmo).padStart(2, "0")}-${String(nd).padStart(2, "0")}`
  );
}

/** Rok v časové zóně Europe/Prague (pro reset číselných řad). */
export function pragueYear(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  return parseInt(y ?? "1970", 10);
}
