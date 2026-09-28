import { getCsrfToken } from "@/lib/auth/csrf";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const csrf = await getCsrfToken();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            CT
          </div>
          <h1 className="text-2xl font-semibold">CvakniTO</h1>
          <p className="text-sm text-muted-foreground">
            Přihlaste se ke svému účtu
          </p>
        </div>
        <LoginForm csrf={csrf} />
      </div>
    </main>
  );
}
