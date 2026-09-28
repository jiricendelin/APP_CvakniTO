type Entry = { failures: number; blockedUntil: number };

const store = new Map<string, Entry>();

const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;

function prune(key: string, now: number): Entry {
  const entry = store.get(key);
  if (!entry) return { failures: 0, blockedUntil: 0 };
  if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
    store.delete(key);
    return { failures: 0, blockedUntil: 0 };
  }
  return entry;
}

export function isLoginBlocked(ip: string): boolean {
  const now = Date.now();
  const entry = prune(ip, now);
  return entry.blockedUntil > now;
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = prune(ip, now);
  const failures = entry.failures + 1;
  if (failures >= MAX_FAILURES) {
    store.set(ip, { failures, blockedUntil: now + BLOCK_MS });
  } else {
    store.set(ip, { failures, blockedUntil: 0 });
  }
}

export function clearLoginFailures(ip: string): void {
  store.delete(ip);
}
