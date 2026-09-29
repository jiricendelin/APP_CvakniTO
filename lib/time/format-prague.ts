export function formatPragueDate(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    dateStyle: "medium",
  }).format(date);
}

export function formatPragueDateTime(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Datum (Praha) jako "YYYY-MM-DD" pro <input type="date">. */
export function formatPragueDateForInput(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
  }).format(date);
}
