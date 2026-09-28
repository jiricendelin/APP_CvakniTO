import { APP_VERSION } from "@/lib/version";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/logout/actions";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-primary">CvakniTO</h1>
      {user && (
        <p className="text-sm text-muted-foreground">{user.email}</p>
      )}
      <p className="text-sm text-muted-foreground">Verze {APP_VERSION}</p>
      {user && (
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Odhlásit se
          </button>
        </form>
      )}
    </main>
  );
}
