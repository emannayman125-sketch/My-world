import { todayISO, addDaysISO } from "@/lib/time";

// The four planning periods and where each one starts (Cairo time).
// The week starts on Saturday.
export const PERIODS = ["daily", "weekly", "monthly", "yearly"];

export function periodStart(period, from = new Date()) {
  const today = todayISO(from);
  const [y, m, d] = today.split("-").map(Number);
  if (period === "daily") return today;
  if (period === "weekly") {
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
    return addDaysISO(-((dow + 1) % 7), from);
  }
  if (period === "monthly") return `${y}-${String(m).padStart(2, "0")}-01`;
  return `${y}-01-01`;
}

// Which of the saved plans belong to the current day / week / month / year.
export function plansInPeriod(plans, period, from = new Date()) {
  const start = periodStart(period, from);
  const today = todayISO(from);
  return plans.filter((g) => {
    if (g.period !== period) return false;
    const created = todayISO(new Date(g.created_at));
    return period === "daily" ? created === today : created >= start;
  });
}

// Share of a plan that is finished (0..1). A plan with small steps under
// it is as done as its steps are; a plan without steps is done or not.
export function planFraction(g, steps = []) {
  const mine = steps.filter((x) => x.goal_id === g.id);
  if (mine.length) return mine.filter((x) => x.is_done).length / mine.length;
  return (g.progress || 0) >= 100 ? 1 : 0;
}

export function stats(list, steps = []) {
  const total = list.length;
  const fr = list.map((g) => planFraction(g, steps));
  const done = fr.filter((f) => f >= 1).length;
  const pct = total ? Math.round((fr.reduce((a, b) => a + b, 0) / total) * 100) : 0;
  return { total, done, pct };
}
