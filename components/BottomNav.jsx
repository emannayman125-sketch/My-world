"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, Sparkles, Sprout, Globe } from "lucide-react";

// Phone-only tab bar. The sidebar takes over on lg+, so this hides there.
// Hamzawi sits in the middle as a raised button: it is the heart of the app,
// and it's the one place the purple (his identity) is allowed to live.
export default function BottomNav({ strings }) {
  const pathname = usePathname() || "";
  const n = strings.nav;

  const tabs = [
    { href: "/dashboard", label: n.home, Icon: Home },
    { href: "/tasks", label: n.tasks, Icon: CheckSquare },
    { href: "/ai", label: n.ai, Icon: Sparkles, center: true },
    { href: "/growth", label: n.growth, Icon: Sprout },
    { href: "/world", label: n.world, Icon: Globe },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-black/[0.06] dark:border-white/[0.08]
                 bg-paper/90 dark:bg-night/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex items-end justify-around px-2 h-16 max-w-xl mx-auto">
        {tabs.map(({ href, label, Icon, center }) => {
          const active = isActive(href);
          if (center) {
            return (
              <li key={href} className="flex-1 flex justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className="-mt-5 flex flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full bg-dusk text-white
                                shadow-duskGlow ring-4 ring-paper dark:ring-night transition-transform
                                ${active ? "scale-105" : ""}`}
                  >
                    <Sparkles size={22} strokeWidth={1.9} />
                  </span>
                  <span className="text-[10px] text-ink-muted dark:text-moon-muted">{label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1 h-16"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.7}
                  className={active ? "text-ink dark:text-moon" : "text-ink-muted dark:text-moon-muted"}
                />
                <span
                  className={`text-[10px] leading-none ${
                    active ? "text-ink dark:text-moon font-medium" : "text-ink-muted dark:text-moon-muted"
                  }`}
                >
                  {label}
                </span>
                <span className={`h-0.5 w-4 rounded-full ${active ? "bg-sage" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
