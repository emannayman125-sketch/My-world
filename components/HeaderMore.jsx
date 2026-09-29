"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

// One quiet "more" button for the phone header, instead of four separate
// controls fighting for 360px. Language, theme and sign out live inside.
export default function HeaderMore({ children, ariaLabel = "More" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10
                   dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute end-0 mt-2 z-40 min-w-[190px] card p-2 flex flex-col gap-1 animate-fade-up"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
