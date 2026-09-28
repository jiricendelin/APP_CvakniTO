/** Načtení SESSION_SECRET bez statického inlinování při `next build` (middleware v Dockeru). */
export function readSessionSecret(): string {
  const key = "SESSION" + "_SECRET";
  return (process.env[key] ?? "").trim();
}
