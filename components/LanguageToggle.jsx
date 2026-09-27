"use client";

import { Languages } from "lucide-react";

export default function LanguageToggle({ locale, label, ariaLabel, variant = "compact" }) {
  function switchLocale() {
    const next = locale === "ar" ? "en" : "ar";
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    window.location.reload();
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={switchLocale}
        aria-label={ariaLabel}
        className="flex items-center gap-2 rounded-soft px-2 py-1.5 text-xs text-ink-muted dark:text-moon-muted
                   hover:text-ink dark:hover:text-moon hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
      >
        <Languages size={14} strokeWidth={2} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={switchLocale}
      aria-label={ariaLabel}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10
                 dark:bg-white/5 dark:hover:bg-white/10 transition text-ink-muted dark:text-moon-muted"
    >
      <Languages size={16} strokeWidth={2} />
    </button>
  );
}
