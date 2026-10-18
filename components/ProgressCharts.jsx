"use client";

import { PERIODS, plansInPeriod, stats } from "@/lib/planRanges";
import { todayISO, addDaysISO } from "@/lib/time";

const L = {
  ar: {
    title: "تقدّمي",
    goalsTitle: "نسبة تحقيق خططي",
    goalsHint: "كل خطة اتعلّمت ✓ بتتحسب.",
    periods: { daily: "اليوم", weekly: "الأسبوع", monthly: "الشهر", yearly: "السنة" },
    of: "من",
    noPlans: "مفيش خطط",
    daysTitle: "آخر ١٤ يوم — أهم ٣ مهام",
    daysHint: "العمود الدهبي = اللي خلصتيه، والرمادي = اللي كان مخطط.",
    none: "لسه مفيش بيانات. ابدئي بإضافة أهم ٣ مهام من الصفحة الرئيسية.",
    overall: "الإنجاز الكلي",
  },
  en: {
    title: "My progress",
    goalsTitle: "Plan completion",
    goalsHint: "Every plan you tick ✓ counts.",
    periods: { daily: "Today", weekly: "This week", monthly: "This month", yearly: "This year" },
    of: "of",
    noPlans: "No plans",
    daysTitle: "Last 14 days — top 3 tasks",
    daysHint: "Gold = finished, grey = planned.",
    none: "No data yet. Start by adding your top 3 tasks on Home.",
    overall: "Overall",
  },
};

// Pure SVG/CSS charts (no chart library): completion by period, and a
// 14-day column chart of the Top-3 tasks.
export default function ProgressCharts({ plans = [], planSteps = [], top3History = [], locale = "ar" }) {
  const T = L[locale] || L.ar;

  const rows = PERIODS.map((p) => ({ p, ...stats(plansInPeriod(plans, p), planSteps) }));
  const withPlans = rows.filter((r) => r.total > 0);
  const overall = withPlans.length
    ? Math.round(withPlans.reduce((a, r) => a + r.pct, 0) / withPlans.length)
    : 0;

  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(i - 13));
  const byDay = Object.fromEntries(days.map((d) => [d, { total: 0, done: 0 }]));
  for (const t of top3History) {
    const d = byDay[t.for_date];
    if (!d) continue;
    d.total += 1;
    if (t.is_done) d.done += 1;
  }
  const hasDays = days.some((d) => byDay[d].total > 0);

  // donut
  const R = 38;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-xl">{T.goalsTitle}</h2>
        <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{T.goalsHint}</p>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0" role="img" aria-label={`${T.overall} ${overall}%`}>
            <svg width="120" height="120" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="pc-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#C2922F" />
                  <stop offset="100%" stopColor="#E8C468" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="9" />
              <circle
                cx="50" cy="50" r={R} fill="none" stroke="url(#pc-gold)" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${(overall / 100) * C} ${C}`} transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl tabular-nums">{overall}%</span>
              <span className="text-[10px] text-ink-muted dark:text-moon-muted">{T.overall}</span>
            </div>
          </div>

          <ul className="w-full space-y-3">
            {rows.map((r) => (
              <li key={r.p}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{T.periods[r.p]}</span>
                  <span className="text-xs text-ink-muted dark:text-moon-muted tabular-nums">
                    {r.total ? `${r.done} ${T.of} ${r.total} · ${r.pct}%` : T.noPlans}
                  </span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-gilded transition-all duration-500" style={{ width: `${r.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-xl">{T.daysTitle}</h2>
        <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{T.daysHint}</p>
        {hasDays ? (
          <div className="mt-4 flex items-end gap-1.5 h-36" dir="ltr">
            {days.map((d) => {
              const { total, done } = byDay[d];
              const H = 112; // px for 3 tasks
              const planned = Math.min(total, 3);
              return (
                <div key={d} className="flex-1 min-w-0 flex flex-col items-center gap-1" title={`${d}: ${done}/${total}`}>
                  <div className="relative w-full max-w-[26px] rounded-md bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden" style={{ height: H, display: "flex", alignItems: "flex-end" }}>
                    <div className="absolute bottom-0 inset-x-0 bg-black/10 dark:bg-white/15" style={{ height: (planned / 3) * H }} />
                    <div className="relative w-full bg-gilded" style={{ height: (Math.min(done, 3) / 3) * H }} />
                  </div>
                  <span className={`text-[10px] tabular-nums ${d === today ? "text-lantern font-medium" : "text-ink-muted dark:text-moon-muted"}`}>
                    {Number(d.slice(8))}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-muted dark:text-moon-muted">{T.none}</p>
        )}
      </section>
    </div>
  );
}
