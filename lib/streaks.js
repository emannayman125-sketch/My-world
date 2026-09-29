import { todayISO, addDaysISO } from "@/lib/time";

// بيحسب الـ Streak الحقيقي: عدد الأيام المتتالية بدون انقطاع (مش مجرد عداد بيزيد كل مرة)
export function computeStreakFromDates(doneDates) {
  const set = new Set(doneDates);

  // لو النهاردة لسه ما اتعملتش، نبدأ العد من إمبارح (عشان ما نصفرش الستريك لحد آخر اليوم)
  let offset = set.has(todayISO()) ? 0 : -1;

  let streak = 0;
  while (set.has(addDaysISO(offset))) {
    streak++;
    offset--;
  }

  return streak;
}

// بيجيب تاريخ العادة (آخر 90 يوم كفاية لأي ستريك واقعي)، يحسب الستريك الصح، ويحفظه
export async function recomputeAndSaveStreak(supabase, habitId, userId) {

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("done_date")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .gte("done_date", addDaysISO(-90));

  const streak = computeStreakFromDates((logs || []).map((l) => l.done_date));

  await supabase.from("habits").update({ current_streak: streak }).eq("id", habitId);

  return streak;
}

// ---------------------------------------------------------------------------
// Overall daily streak ("showing up" streak), separate from per-habit streaks.
//
// A day is ACTIVE if he did anything real: checked a habit, finished a top-3
// item, saved an evening review, wrote a journal line, logged an English
// session, or logged a trade. Gentle rule ("never miss twice"): one quiet day
// never breaks the streak; two quiet days in a row do. Quiet days don't add
// to the count. Today never counts against him: the day isn't over yet.
// ---------------------------------------------------------------------------
function shiftISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * @param {Set<string>} dateSet  active days, "YYYY-MM-DD" (Cairo)
 * @param {string} [today]
 * @returns {{ current: number, best: number, doneToday: boolean, atRisk: boolean, last7: {date: string, active: boolean}[] }}
 */
export function computeActivityStreak(dateSet, today = todayISO()) {
  const active = (d) => dateSet.has(d);
  const doneToday = active(today);

  // current streak: walk back from today
  let current = 0;
  let gap = 0;
  for (let off = 0; off >= -400; off--) {
    const d = shiftISO(today, off);
    if (active(d)) {
      current++;
      gap = 0;
    } else {
      if (off === 0) continue; // today is still open
      gap++;
      if (gap >= 2) break;
    }
  }

  // best streak: walk forward from the first active day
  let best = 0;
  if (dateSet.size > 0) {
    const start = [...dateSet].sort()[0];
    let run = 0;
    let g = 0;
    for (let d = start; d <= today; d = shiftISO(d, 1)) {
      if (active(d)) {
        run++;
        g = 0;
        if (run > best) best = run;
      } else {
        g++;
        if (g >= 2) run = 0;
      }
    }
  }
  best = Math.max(best, current);

  // one quiet day already, and today is still empty: a small nudge is enough
  const atRisk = current > 0 && !doneToday && !active(shiftISO(today, -1));

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = shiftISO(today, -i);
    last7.push({ date: d, active: active(d) });
  }

  return { current, best, doneToday, atRisk, last7 };
}
