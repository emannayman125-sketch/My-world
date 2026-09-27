import Link from "next/link";
import { CheckSquare, MapPinned, Headphones, Sparkles, Check } from "lucide-react";

// Real progress, not fake onboarding fluff — each item reflects whether
// that kind of data actually exists yet, and the whole card disappears
// once the world has started filling in on its own.
export default function GettingStarted({ hasTasks, hasMemory, hasWorldItem, strings }) {
  const g = strings.dashboard.gettingStarted;

  const items = [
    { key: "addTask", done: hasTasks, icon: CheckSquare, href: "/tasks", label: g.addTask },
    { key: "addMemory", done: hasMemory, icon: MapPinned, href: "/timeline", label: g.addMemory },
    { key: "addWorldItem", done: hasWorldItem, icon: Headphones, href: "/world", label: g.addWorldItem },
    { key: "talkToHamzawi", done: false, icon: Sparkles, href: "/ai", label: g.talkToHamzawi, alwaysOpen: true },
  ];

  const remaining = items.filter((i) => !i.done && !i.alwaysOpen);
  if (remaining.length === 0) return null;

  return (
    <div className="card p-5">
      <p className="font-display text-lg mb-0.5">{g.title}</p>
      <p className="text-sm text-ink-muted dark:text-moon-muted mb-4">{g.subtitle}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.done) {
            return (
              <div key={item.key} className="flex items-center gap-2.5 rounded-soft px-3 py-2.5 text-sm text-ink-muted dark:text-moon-muted">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lantern/20 text-lantern shrink-0">
                  <Check size={13} strokeWidth={2.5} />
                </span>
                <span className="line-through">{item.label}</span>
              </div>
            );
          }
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-2.5 rounded-soft border border-black/10 dark:border-white/10 px-3 py-2.5 text-sm
                         hover:border-lantern/50 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted shrink-0">
                <Icon size={13} strokeWidth={2} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
