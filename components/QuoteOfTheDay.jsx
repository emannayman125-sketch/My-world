import { Quote } from "lucide-react";
import AddThoughtForm from "./AddThoughtForm";

// Renders a single literary quote as a quiet, minimal moment — a small
// category tag, generous whitespace, no motivational-poster styling.
// Styled distinctly from Hamzawi's (dusk) and plain cards so it reads as
// its own clear beat rather than blending into the blocks around it.
export default function QuoteOfTheDay({ quote, userId, strings }) {
  const isAr = quote.lang === "ar";
  const fontClass = quote.isPersonal ? "font-display" : isAr ? "font-display" : "font-letter";

  return (
    <div className="rounded-card border border-sage/25 bg-sage/[0.06] dark:bg-sage/[0.09] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft">
          <Quote size={15} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          {quote.category && (
            <p className="text-[10px] tracking-[0.18em] text-sage dark:text-sage-soft mb-2">
              {quote.category}
            </p>
          )}

          <p
            dir={quote.isPersonal ? undefined : isAr ? "rtl" : "ltr"}
            className={`${fontClass} text-base sm:text-lg leading-8 whitespace-pre-line ${
              !quote.isPersonal && !isAr ? "italic" : ""
            }`}
          >
            {quote.text}
          </p>

          {quote.author && (
            <p className="mt-3 text-sm text-ink-muted dark:text-moon-muted">— {quote.author}</p>
          )}

          {quote.translation && (
            <span className="inline-block mt-2 text-[10px] rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5 text-ink-muted dark:text-moon-muted">
              {strings.quote.translationTag}
            </span>
          )}

          {userId && <AddThoughtForm userId={userId} strings={strings} />}
        </div>
      </div>
    </div>
  );
}
