"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Same pattern as Collapsible, but for the Trading pages, which always use
// the dark "desk" theme regardless of the site's own light/dark setting.
export default function DeskCollapsible({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="desk-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-start"
      >
        <span className="flex-1 text-sm font-medium">{title}</span>
        <ChevronDown size={16} className={`shrink-0 desk-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4 border-t border-white/10">{children}</div>}
    </div>
  );
}
