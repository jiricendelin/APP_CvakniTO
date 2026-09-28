import { cookies } from "next/headers";
import { CSRF_COOKIE, CSRF_FIELD } from "./csrf-shared";

export { CSRF_COOKIE, CSRF_FIELD };

export async function getCsrfToken(): Promise<string> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? "";
}

export async function assertCsrf(formData: FormData): Promise<void> {
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const formToken = formData.get(CSRF_FIELD);
  if (
    !cookieToken ||
    typeof formToken !== "string" ||
    formToken !== cookieToken
  ) {
    throw new Error("Neplatný CSRF token. Obnovte stránku a zkuste to znovu.");
  }
}
