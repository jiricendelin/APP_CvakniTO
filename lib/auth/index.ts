import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
} from "./session";

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  createdAt: Date;
};

export async function createSession(userId: string): Promise<void> {
  const token = await signSession(userId, env.sessionSecret);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const uid = await verifySession(token, env.sessionSecret);
  if (!uid) return null;

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      tenantId: true,
      email: true,
      createdAt: true,
    },
  });
  return user;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Tenant z přihlášené session — pro všechny DB dotazy od R4 dál. */
export async function getTenantId(): Promise<string> {
  const user = await requireUser();
  return user.tenantId;
}
