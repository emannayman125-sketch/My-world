"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// One tappable row that expands into everything else: this is the main
// tool for cutting Home's clutter — six separate cards become one.
export default function Collapsible({ title, icon, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-start"
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          {!open && summary && (
            <span className="block text-xs text-ink-muted dark:text-moon-muted truncate mt-0.5">{summary}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-muted dark:text-moon-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-black/[0.06] dark:border-white/[0.06]">
          {children}
        </div>
      )}
    </div>
  );
}
