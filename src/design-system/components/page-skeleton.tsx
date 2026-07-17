import { cn } from "@/lib/utils";

export function PageSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("animate-pulse space-y-4", className)} aria-busy="true">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-2xl border border-border bg-muted/60"
        />
      ))}
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
