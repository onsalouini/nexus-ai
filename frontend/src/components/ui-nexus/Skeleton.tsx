/* Squelettes de chargement : remplacent les simples textes "Chargement…" */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden="true" />;
}

export function SkeletonCards({ count = 3, className = "h-40" }: { count?: number; className?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 ${className}`}>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-3 h-3 w-3/4" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <Skeleton className="mt-6 h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
