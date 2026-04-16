export default function BlogLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div className="mb-6 h-9 w-64 animate-pulse rounded-md bg-muted/70" />
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-md border border-border/70 bg-card/60"
            />
          ))}
        </div>
        <div className="space-y-4 lg:col-span-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-border/70 bg-card/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
