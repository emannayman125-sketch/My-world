import Link from "next/link";
import { Megaphone } from "lucide-react";

// A plain visible card, not a browser push notification (see ReminderNotifier
// for that) -- only shows items he explicitly marked "remind me" on
// (content_items.auto_publish) with a publish_date of today. Links straight
// to Creator Studio to actually post it.
export default function ContentDueToday({ items, strings }) {
  const c = strings.creator;

  return (
    <Link
      href="/creator"
      className="block rounded-card bg-violet-500/[0.06] dark:bg-violet-400/[0.08] border border-violet-500/20 p-4 hover:bg-violet-500/[0.1] transition"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-500">
          <Megaphone size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{c.dueTodayTitle}</p>
          <ul className="mt-1 space-y-0.5">
            {items.map((item) => (
              <li key={item.id} className="text-xs text-ink-muted dark:text-moon-muted truncate">
                {item.publish_time && <span className="tabular-nums">{item.publish_time.slice(0, 5)} — </span>}
                {item.title} <span className="text-ink-muted/70 dark:text-moon-muted/70">({c.platforms[item.platform] || item.platform})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
}
