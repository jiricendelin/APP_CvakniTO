import { APP_VERSION } from "@/lib/version";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold text-primary">CvakniTO</h1>
      <p className="text-sm text-muted-foreground">Verze {APP_VERSION}</p>
    </main>
  );
}
