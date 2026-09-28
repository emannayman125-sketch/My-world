// Single source of truth for "what day is it" in Ahmed's world.
// Vercel servers run in UTC, and browsers may be in any timezone, so
// `new Date().toISOString().slice(0, 10)` gives the WRONG day between
// 00:00 and ~03:00 Cairo time. Everything date-based goes through here.

export const APP_TZ = "Africa/Cairo";

function parts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = {};
  for (const x of fmt.formatToParts(date)) p[x.type] = x.value;
  return p;
}

/** "YYYY-MM-DD" for the given moment, in Cairo time. */
export function todayISO(date = new Date()) {
  const p = parts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Cairo date shifted by N days (negative = past). Returns "YYYY-MM-DD". */
export function addDaysISO(days, from = new Date()) {
  const [y, m, d] = todayISO(from).split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** Start of the current week (Sunday) in Cairo time, "YYYY-MM-DD". */
export function weekStartISO(from = new Date()) {
  const [y, m, d] = todayISO(from).split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDaysISO(-dow, from);
}

/** Numeric parts of "now" in Cairo. */
export function cairoNow(date = new Date()) {
  const p = parts(date);
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
  };
}
