import { CalendarDays } from "lucide-react";

// The Home banner: an original sunrise-over-mountains illustration
// (layered SVG, no photo, nobody in it) with the greeting on top.
// Server component -- no client JS.
export default function HeroSunrise({ greeting, name, dateLabel, subtitle, avatarUrl }) {
  return (
    <header className="relative overflow-hidden rounded-card h-60 sm:h-64 shadow-card dark:shadow-cardDark">
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E2A27" />
            <stop offset="45%" stopColor="#2F6A5C" />
            <stop offset="78%" stopColor="#E8C468" />
            <stop offset="100%" stopColor="#F6DDA8" />
          </linearGradient>
          <radialGradient id="hs-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFF3CF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#F6DDA8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F6DDA8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="400" fill="url(#hs-sky)" />
        <circle cx="600" cy="272" r="230" fill="url(#hs-sun)" />
        <circle cx="600" cy="272" r="44" fill="#FFF3CF" />
        <path
          d="M0 270 L120 222 L220 252 L360 178 L480 242 L600 200 L740 256 L880 186 L1010 246 L1120 212 L1200 240 L1200 400 L0 400Z"
          fill="#7FA79C"
          opacity="0.55"
        />
        <path
          d="M0 312 L90 272 L210 306 L330 248 L450 304 L560 266 L690 310 L820 250 L950 306 L1070 272 L1200 308 L1200 400 L0 400Z"
          fill="#2F6A5C"
          opacity="0.85"
        />
        <path
          d="M0 352 L140 324 L260 352 L400 318 L540 356 L690 330 L840 358 L990 324 L1110 350 L1200 334 L1200 400 L0 400Z"
          fill="#0F2B26"
        />
      </svg>

      <div className="relative h-full flex flex-col items-center justify-start text-center text-white px-5 pt-7 sm:pt-8">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/60 mb-2"
          />
        )}
        <h1 className="font-display text-3xl sm:text-4xl leading-tight" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
          {greeting} {name}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm sm:text-base text-white/90" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="absolute bottom-3 start-4 flex items-center gap-2 text-xs text-white/90">
        <CalendarDays size={14} />
        <span>{dateLabel}</span>
      </div>
    </header>
  );
}
