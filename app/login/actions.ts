"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth";
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

export type LoginState = { error?: string };

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

  const email = parsed.data.email.toLowerCase().trim();
  const users = await prisma.user.findMany({ where: { email } });

  if (users.length === 0) {
    recordLoginFailure(ip);
    return { error: "Nesprávný email nebo heslo." };
  }

  if (users.length > 1) {
    return {
      error:
        "Tento email je u více účtů. Kontaktujte správce (upřesněte tenant).",
    };
  }

  const user = users[0]!;
  const ok = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!ok) {
    recordLoginFailure(ip);
    return { error: "Nesprávný email nebo heslo." };
  }

  clearLoginFailures(ip);
  await createSession(user.id);
  redirect("/");
}
