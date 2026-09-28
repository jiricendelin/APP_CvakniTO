import { prisma } from "@/lib/prisma";

export type LoginUserResult =
  | { ok: true; user: { id: string; passwordHash: string } }
  | { ok: false; error: string };

/** Najde uživatele podle emailu (case-insensitive, PostgreSQL). */
export async function resolveLoginUser(
  emailRaw: string
): Promise<LoginUserResult> {
  const email = emailRaw.toLowerCase().trim();

  const users = await prisma.user.findMany({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: { id: true, email: true, passwordHash: true, tenantId: true },
  });

  if (users.length === 0) {
    return { ok: false, error: "Nesprávný email nebo heslo." };
  }

  if (users.length > 1) {
    const tenantIds = new Set(users.map((u) => u.tenantId));
    if (tenantIds.size > 1) {
      return {
        ok: false,
        error:
          "Tento email je u více účtů. Kontaktujte správce (upřesněte tenant).",
      };
    }
  }

  const user = users[0]!;

  if (user.email !== email) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email },
    });
  }

  return { ok: true, user: { id: user.id, passwordHash: user.passwordHash } };
}
