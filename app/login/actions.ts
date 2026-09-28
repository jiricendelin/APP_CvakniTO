"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth";
import { resolveLoginUser } from "@/lib/auth/resolve-login-user";
import { assertCsrf } from "@/lib/auth/csrf";
import {
  clearLoginFailures,
  isLoginBlocked,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().email("Neplatný email"),
  password: z.string().min(1, "Zadejte heslo"),
});

export type LoginState = { error?: string; success?: boolean };

function clientIp(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip")?.trim() || "unknown";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const ip = clientIp(await headers());
  if (isLoginBlocked(ip)) {
    return {
      error: "Příliš mnoho neúspěšných pokusů. Zkuste to znovu za 15 minut.",
    };
  }

  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neplatný vstup" };
  }

  const resolved = await resolveLoginUser(parsed.data.email);
  if (!resolved.ok) {
    recordLoginFailure(ip);
    return { error: resolved.error };
  }

  const ok = await verifyPassword(
    resolved.user.passwordHash,
    parsed.data.password
  );
  if (!ok) {
    recordLoginFailure(ip);
    return { error: "Nesprávný email nebo heslo." };
  }

  clearLoginFailures(ip);
  await createSession(resolved.user.id);
  return { success: true };
}
