/** Rok v časové zóně Europe/Prague (pro reset číselných řad). */
export function pragueYear(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  return parseInt(y ?? "1970", 10);
}
