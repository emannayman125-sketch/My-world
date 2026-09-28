import AddThoughtForm from "./AddThoughtForm";

// Renders a single literary quote as a quiet, minimal moment — a small
// category tag, generous whitespace, no motivational-poster styling.
export default function QuoteOfTheDay({ quote, userId, strings }) {
  const isAr = quote.lang === "ar";
  const fontClass = quote.isPersonal ? "font-display" : isAr ? "font-display" : "font-letter";

  return (
    <div className="card card-hover p-6 sm:p-7">
      {quote.category && (
        <p className="text-[10px] tracking-[0.18em] text-sage dark:text-sage-soft mb-4">
          {quote.category}
        </p>
      )}

      <p
        dir={quote.isPersonal ? undefined : isAr ? "rtl" : "ltr"}
        className={`${fontClass} text-lg sm:text-xl leading-9 whitespace-pre-line ${
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
  );
}
