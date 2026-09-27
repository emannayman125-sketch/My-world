function Bar({ className = "" }) {
  return (
    <div
      className={`rounded-full bg-black/10 dark:bg-white/10 bg-[length:200%_100%]
                  animate-shimmer bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent ${className}`}
    />
  );
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card p-6 space-y-3">
      <Bar className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Bar key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export default function PageSkeleton({ title = true, cards = 3 }) {
  return (
    <div className="min-h-screen bg-paper dark:bg-night px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {title && <Bar className="h-8 w-40" />}
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} lines={i % 2 === 0 ? 2 : 3} />
        ))}
      </div>
    </div>
  );
}
