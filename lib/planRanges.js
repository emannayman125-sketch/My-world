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

export function stats(list) {
  const total = list.length;
  const done = list.filter((g) => (g.progress || 0) >= 100).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}
