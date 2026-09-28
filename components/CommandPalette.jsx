"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Plus, CalendarDays, NotebookPen, Target } from "lucide-react";
import { getNavItems } from "@/lib/navSections";

export default function CommandPalette({ variant = "compact", strings }) {
  const ACTIONS = [
    { href: "/tasks", icon: Plus, label: strings.quickActions.addTask, keywords: "add task new" },
    { href: "/timeline", icon: Plus, label: strings.quickActions.addMemory, keywords: "add memory new" },
    { href: "/journal", icon: NotebookPen, label: strings.quickActions.writeJournal, keywords: "write journal" },
    { href: "/calendar", icon: CalendarDays, label: strings.quickActions.openCalendar, keywords: "open calendar" },
    { href: "/dashboard", icon: Target, label: strings.quickActions.startFocus, keywords: "focus start" },
  ];
  const NAV_ITEMS = getNavItems(strings);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      const isK = e.key === "k" || e.key === "K";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filteredActions = query.trim()
    ? ACTIONS.filter(
        (a) => a.label.includes(query) || a.keywords.toLowerCase().includes(query.toLowerCase())
      )
    : ACTIONS;

  const filtered = query.trim()
    ? NAV_ITEMS.filter(
        (s) => s.label.includes(query) || s.keywords.toLowerCase().includes(query.toLowerCase())
      )
    : NAV_ITEMS;

  function go(href) {
    setOpen(false);
    router.push(href);
  }

  function searchQuery(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      {variant === "sidebar" ? (
        <button
          onClick={() => setOpen(true)}
          aria-label={strings.searchPlaceholder}
          className="flex items-center gap-2.5 w-full rounded-soft border border-black/10 dark:border-white/10
                     bg-black/[0.02] dark:bg-white/[0.03] px-3 py-2.5 text-sm text-ink-muted dark:text-moon-muted
                     hover:border-sage/50 hover:text-ink dark:hover:text-moon transition"
        >
          <Search size={16} strokeWidth={2} />
          <span className="flex-1 text-right">{strings.searchPlaceholder}</span>
          <kbd className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={strings.searchPlaceholder}
          className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10
                     px-3 py-2 text-xs text-ink-muted dark:text-moon-muted hover:border-sage transition"
        >
          <Search size={14} strokeWidth={2} />
          <span className="hidden sm:inline">{strings.searchPlaceholder}</span>
          <kbd className="hidden sm:inline rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-night/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-md glass rounded-full_card shadow-glow overflow-hidden"
            >
              <form onSubmit={searchQuery} className="flex items-center gap-2 px-5 py-4 border-b border-black/5 dark:border-white/10">
                <Search size={16} strokeWidth={2} className="text-ink-muted dark:text-moon-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={strings.searchInputPlaceholder}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </form>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredActions.length > 0 && (
                  <>
                    {filteredActions.map((a) => (
                      <button
                        key={a.href + a.label}
                        onClick={() => go(a.href)}
                        className="w-full flex items-center gap-3 text-right rounded-soft px-3 py-2.5 text-sm
                                   hover:bg-sage/15 transition"
                      >
                        <a.icon size={16} strokeWidth={2} className="text-ink-muted dark:text-moon-muted" />
                        <span>{a.label}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-black/5 dark:border-white/10" />
                  </>
                )}

                {filtered.map((s) => (
                  <button
                    key={s.href}
                    onClick={() => go(s.href)}
                    className="w-full flex items-center gap-3 text-right rounded-soft px-3 py-2.5 text-sm
                               hover:bg-sage/15 transition"
                  >
                    <s.icon size={16} strokeWidth={2} className="text-ink-muted dark:text-moon-muted" />
                    <span>{s.label}</span>
                  </button>
                ))}

                {filtered.length === 0 && filteredActions.length === 0 && (
                  <button
                    onClick={searchQuery}
                    className="w-full flex items-center gap-3 text-right rounded-soft px-3 py-2.5 text-sm hover:bg-sage/15 transition"
                  >
                    <Search size={16} strokeWidth={2} />
                    <span>{strings.searchNoResults.replace("{query}", query)}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
