import { Flame } from "lucide-react";

// Home: the overall daily streak. Server component, no client JS needed.
export default function StreakCard({ streak, locale, strings: s }) {
  const { current, best, doneToday, atRisk, last7 } = streak;
  const everActive = best > 0;

  let message;
  if (!everActive) message = s.start;
  else if (doneToday) message = s.todayDone;
  else if (atRisk) message = s.atRisk;
  else message = s.todayOpen;

  const dayLabel = (iso) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "narrow",
      timeZone: "UTC",
    });

  return (
    <section className="card px-5 py-4" aria-label={`${current} ${s.unit}`}>
      <div className="flex items-center gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            current > 0
              ? "bg-sage/15 text-sage dark:text-sage-soft"
              : "bg-black/5 dark:bg-white/5 text-ink-muted dark:text-moon-muted"
          }`}
        >
          <Flame size={22} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none">
            {current}{" "}
            <span className="font-body text-sm text-ink-muted dark:text-moon-muted">{s.unit}</span>
          </p>
          <p className="text-xs text-ink-muted dark:text-moon-muted mt-1.5 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center" aria-hidden="true">
        {last7.map((d, i) => {
          const isToday = i === last7.length - 1;
          return (
            <div key={d.date}>
              <span
                className={`mx-auto block h-2.5 w-2.5 rounded-full ${
                  d.active ? "bg-sage" : "bg-black/10 dark:bg-white/15"
                } ${isToday ? "ring-2 ring-offset-2 ring-sage/40 ring-offset-paper-card dark:ring-offset-night-card" : ""}`}
              />
              <span className="block text-[10px] mt-1.5 text-ink-muted dark:text-moon-muted">
                {dayLabel(d.date)}
              </span>
            </div>
          );
        })}
      </div>

      {best >= 3 && best > current && (
        <p className="text-[11px] text-ink-muted dark:text-moon-muted mt-3">{s.best.replace("{n}", String(best))}</p>
      )}
      <p className="text-[11px] text-ink-muted/80 dark:text-moon-muted/80 mt-1">{s.rule}</p>
    </section>
  );
}
