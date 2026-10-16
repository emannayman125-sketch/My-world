import { CalendarDays } from "lucide-react";
import AddThoughtForm from "./AddThoughtForm";

// The Home banner: the misty-hills photo, shown clearly, with a reserved
// frosted-glass panel on the start side where the greeting and the day's
// quote live. The person on the grass stays in the open middle of the
// picture. On phones the panel sits on top and the photo shows below it.
export default function HeroPhoto({ greeting, name, dateLabel, avatarUrl, quote, userId, strings }) {
  const isAr = quote.lang === "ar";
  const fontClass = quote.isPersonal || isAr ? "font-display" : "font-letter";
  const len = (quote.text || "").length;
  // the text size follows the quote length so it always fits the panel
  const size =
    len <= 70 ? "text-xl sm:text-2xl" : len <= 140 ? "text-lg sm:text-xl" : len <= 240 ? "text-base sm:text-lg" : "text-sm sm:text-base";
  const shadow = { textShadow: "0 1px 10px rgba(0,0,0,0.45)" };

  return (
    <header className="dark relative isolate overflow-hidden rounded-card text-white shadow-card dark:shadow-cardDark min-h-[32rem] sm:min-h-[26rem] flex">
      <style>{`
        @keyframes hero-drift { from { transform: scale(1.03); } to { transform: scale(1.1) translate3d(-1.2%, -0.8%, 0); } }
        .hero-photo { animation: hero-drift 30s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .hero-photo { animation: none; } }
      `}</style>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/quote-bg.jpg"
        alt=""
        aria-hidden="true"
        className="hero-photo absolute inset-0 -z-20 h-full w-full object-cover object-[50%_80%]"
      />
      {/* only a light wash: the photo stays bright, the glass panel does the work */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(10,24,22,0.35) 0%, rgba(10,24,22,0.05) 45%, rgba(10,24,22,0.25) 100%)",
        }}
      />

      <div className="relative flex w-full flex-col p-4 sm:p-6 sm:w-[46%] lg:w-[42%]">
        <div className="flex items-center gap-3 px-1">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/60" />
          )}
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl leading-tight truncate" style={shadow}>
              {greeting} {name}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/90" style={shadow}>
              <CalendarDays size={13} />
              {dateLabel}
            </p>
          </div>
        </div>

        <figure className="mt-4 rounded-2xl border border-white/25 bg-[#0A1816]/45 backdrop-blur-md px-5 py-5 shadow-lg">
          <span aria-hidden="true" className="block font-display text-5xl leading-none text-lantern-soft/70 -mb-3 select-none">
            “
          </span>
          {quote.category && (
            <figcaption className="text-[11px] text-lantern-soft mb-2 tracking-wide">{quote.category}</figcaption>
          )}
          <blockquote
            dir={quote.isPersonal ? undefined : isAr ? "rtl" : "ltr"}
            className={`${fontClass} ${size} leading-[1.9] whitespace-pre-line ${
              !quote.isPersonal && !isAr ? "italic" : ""
            }`}
          >
            {quote.text}
          </blockquote>
          {quote.author && <p className="mt-3 text-sm text-lantern-soft">— {quote.author}</p>}
          {quote.translation && (
            <span className="inline-block mt-2 text-[10px] rounded-full border border-white/25 px-2 py-0.5 text-white/80">
              {strings.quote.translationTag}
            </span>
          )}
          {userId && (
            <div className="[&>button]:mt-3 [&>button]:text-white/70 [&>button:hover]:text-white">
              <AddThoughtForm userId={userId} strings={strings} />
            </div>
          )}
        </figure>
      </div>
    </header>
  );
}
