"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { getNavGroups } from "@/lib/navSections";

// Mobile-only navigation drawer. On large screens the Sidebar component
// takes over, so this stays hidden there.
export default function NavMenu({ strings }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const groups = getNavGroups(strings);
  const offscreenX = strings.dir === "rtl" ? 320 : -320;

  // The drawer is rendered via a portal into <body> (see below). AppHeader's
  // mobile bar uses backdrop-blur, and a backdrop-filter creates a
  // containing block for position:fixed descendants — without the portal,
  // the "fixed" drawer would be trapped inside that thin header bar instead
  // of covering the full screen.
  useEffect(() => setMounted(true), []);

  const overlay = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-night/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: offscreenX }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-y-0 end-0 z-40 w-72 bg-paper dark:bg-night shadow-glow
                       flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="font-display text-lg">{strings.brand} 🌍</span>
              <button
                onClick={() => setOpen(false)}
                aria-label={strings.closeMenu}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <nav className="px-3 pb-6 space-y-5">
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
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-soft px-3 py-2.5 text-sm transition
                            ${active
                              ? "bg-sage/15 text-ink dark:text-moon font-medium"
                              : "text-ink-muted dark:text-moon-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"}`}
                        >
                          <Icon size={17} strokeWidth={2} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative lg:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={strings.openMenu}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10
                   dark:bg-white/5 dark:hover:bg-white/10 transition"
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
