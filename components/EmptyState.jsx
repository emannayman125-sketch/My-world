import Link from "next/link";

// A shared, intentional empty state — replaces bare "No X yet" text
// across the app with an icon, a message, and (optionally) a way to
// act on it right there.
export default function EmptyState({ icon: Icon, title, hint, actionLabel, actionHref, onAction, tone = "lantern" }) {
  const toneClasses = {
    lantern: "bg-sage/12 text-sage dark:text-sage-soft",
    dusk: "bg-dusk/12 text-dusk",
    sky: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
    violet: "bg-violet-500/12 text-violet-500",
    copper: "bg-[#B5624A]/12 text-[#8F4A36] dark:text-[#C97D60]",
  }[tone] || "bg-sage/12 text-sage dark:text-sage-soft";

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-3">
      {Icon && (
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ${toneClasses}`}>
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <p className="font-display text-lg">{title}</p>
      {hint && <p className="text-sm text-ink-muted dark:text-moon-muted max-w-xs">{hint}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-1 text-sm rounded-full bg-lantern text-night font-medium px-4 py-2 hover:brightness-105 transition"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="mt-1 text-sm rounded-full bg-lantern text-night font-medium px-4 py-2 hover:brightness-105 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
