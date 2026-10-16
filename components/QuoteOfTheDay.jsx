import AddThoughtForm from "./AddThoughtForm";

// The day's quote, as the first thing after the greeting: a deep-jade
// banner with a gold hairline and one oversized quotation mark. It is
// always dark (in both themes) on purpose -- it's the one "framed
// page" on Home, like a gilded plate in a manuscript. The `dark` class
// on the wrapper makes the nested AddThoughtForm pick its dark styles.
export default function QuoteOfTheDay({ quote, userId, strings }) {
  const isAr = quote.lang === "ar";
  const fontClass = quote.isPersonal || isAr ? "font-display" : "font-letter";

  return (
    <figure
      className="dark relative overflow-hidden rounded-card px-6 py-6 sm:px-8 sm:py-7 text-moon
                 border border-lantern/30 shadow-cardDark"
      style={{
        backgroundImage:
          "radial-gradient(420px circle at 100% 0%, rgba(194,146,47,0.22), transparent 60%), linear-gradient(135deg, #0F2B26 0%, #0A1816 100%)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-3 start-4 font-display text-[110px] leading-none text-lantern/30 select-none"
      >
        “
      </span>

      <div className="relative">
        {quote.category && (
          <figcaption className="text-xs text-lantern-soft mb-3">{quote.category}</figcaption>
        )}

        <blockquote
          dir={quote.isPersonal ? undefined : isAr ? "rtl" : "ltr"}
          className={`${fontClass} text-xl sm:text-2xl leading-[1.9] whitespace-pre-line ${
            !quote.isPersonal && !isAr ? "italic" : ""
          }`}
        >
          {quote.text}
        </blockquote>

        {quote.author && (
          <p className="mt-4 text-sm text-lantern-soft">— {quote.author}</p>
        )}

        {quote.translation && (
          <span className="inline-block mt-3 text-[10px] rounded-full border border-white/15 px-2 py-0.5 text-moon-muted">
            {strings.quote.translationTag}
          </span>
        )}

        {userId && <AddThoughtForm userId={userId} strings={strings} />}
      </div>
    </figure>
  );
}
