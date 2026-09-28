export function formatPragueDateTime(date: Date): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: "Europe/Prague",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
