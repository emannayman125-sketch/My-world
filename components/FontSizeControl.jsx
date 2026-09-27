"use client";

import { useFontSize } from "./FontSizeProvider";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const TEXT = {
  ar: { heading: "🔎 حجم الخط", hint: "كبّري أو صغّري خط الموقع كله عشان تريح عينك." },
  en: { heading: "🔎 Font size", hint: "Make the whole site's text bigger or smaller for easier reading." },
};

const OPTIONS = [
  { key: "normal", label: "A", scale: "text-sm" },
  { key: "large", label: "A", scale: "text-base" },
  { key: "xlarge", label: "A", scale: "text-lg" },
];

export default function FontSizeControl() {
  const { fontSize, setFontSize } = useFontSize();
  const locale = getClientLocale();
  const tx = TEXT[locale] || TEXT.en;

  return (
    <div className="card p-6 space-y-3">
      <h2 className="font-display text-xl">{tx.heading}</h2>
      <p className="text-sm text-ink-muted dark:text-moon-muted">{tx.hint}</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFontSize(opt.key)}
            className={`${opt.scale} rounded-soft px-4 py-2 transition
              ${fontSize === opt.key ? "bg-lantern text-night" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
