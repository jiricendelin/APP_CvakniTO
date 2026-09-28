export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-2">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">Zatím prázdné.</p>
    </div>
  );
}
