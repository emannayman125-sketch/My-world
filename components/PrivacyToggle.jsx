"use client";

import { getClientLocale } from "@/lib/i18n/getClientLocale";

const TITLE = {
  ar: { on: "عام — يظهر في صفحتك العامة", off: "خاص — يظهر لك بس" },
  en: { on: "Public — shown on your public page", off: "Private — visible to you only" },
};
const LABEL = { ar: { on: "🌐 عام", off: "🔒 خاص" }, en: { on: "🌐 Public", off: "🔒 Private" } };

export default function PrivacyToggle({ isPublic, onToggle }) {
  const locale = getClientLocale();
  const t = TITLE[locale] || TITLE.en;
  const l = LABEL[locale] || LABEL.en;

  return (
    <button
      onClick={onToggle}
      title={isPublic ? t.on : t.off}
      className={`text-xs rounded-full px-2 py-0.5 shrink-0 transition
        ${isPublic
          ? "bg-dusk/15 text-dusk"
          : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"}`}
    >
      {isPublic ? l.on : l.off}
    </button>
  );
}
