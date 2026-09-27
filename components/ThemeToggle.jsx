"use client";

import { useTheme } from "./ThemeProvider";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const LABEL = { ar: "تبديل المظهر بين النهار والليل", en: "Toggle light / dark mode" };

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const locale = getClientLocale();

  return (
    <button
      onClick={toggleTheme}
      aria-label={LABEL[locale] || LABEL.en}
      className="w-10 h-10 rounded-full flex items-center justify-center text-lg
                 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10
                 transition-colors"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
