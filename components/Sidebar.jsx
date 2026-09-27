"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavGroups } from "@/lib/navSections";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import SignOutButton from "./SignOutButton";
import LanguageToggle from "./LanguageToggle";

export default function Sidebar({ locale, strings }) {
  const pathname = usePathname();
  const groups = getNavGroups(strings);

  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 start-0 z-20 w-64 flex-col
                 border-e border-black/[0.06] dark:border-white/[0.06]
                 bg-paper-card/70 dark:bg-night-card/40 backdrop-blur-xl"
    >
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pt-6 pb-4 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lantern/20 text-lantern">
          🌍
        </span>
        <span className="font-display text-lg leading-none">{strings.brand}</span>
      </Link>

      <div className="px-4 pb-3 shrink-0">
        <CommandPalette variant="sidebar" strings={strings} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-3 pb-1.5 text-xs text-ink-muted/70 dark:text-moon-muted/70">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-soft px-3 py-2 text-sm transition
                      ${
                        active
                          ? "bg-lantern/15 text-ink dark:text-moon font-medium"
                          : "text-ink-muted dark:text-moon-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-ink dark:hover:text-moon"
                      }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 transition
                        ${active ? "bg-lantern/25 text-lantern" : "text-ink-muted/80 dark:text-moon-muted/80 group-hover:text-ink dark:group-hover:text-moon"}`}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-lantern" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <SignOutButton label={strings.signOut} />
        <div className="flex items-center gap-1">
          <LanguageToggle
            locale={locale}
            label={strings.switchLanguage}
            ariaLabel={strings.switchLanguageAria}
            variant="sidebar"
          />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
