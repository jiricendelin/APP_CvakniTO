import { CSRF_FIELD } from "@/lib/auth/csrf-shared";

export function CsrfField({ token }: { token: string }) {
  return <input type="hidden" name={CSRF_FIELD} value={token} />;
}
