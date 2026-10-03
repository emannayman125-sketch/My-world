import { addDaysISO, todayISO } from "@/lib/time";

// Spaced review for memorized portions: each successful review pushes the
// next one further out. Capped at the last interval, not "finished" —
// Quran retention is a lifelong practice, so a mastered portion keeps
// resurfacing every ~5 weeks forever, it never drops off the list for good.
export const REVIEW_INTERVALS = [1, 3, 7, 16, 35];

export function nextReviewLevel(currentLevel) {
  return Math.min(currentLevel + 1, REVIEW_INTERVALS.length - 1);
}

export function intervalForLevel(level) {
  const i = Math.max(0, Math.min(level, REVIEW_INTERVALS.length - 1));
  return REVIEW_INTERVALS[i];
}

/** What finishing memorization sets on the row. */
export function markMemorizedPatch(today = todayISO()) {
  return {
    status: "reviewing",
    review_level: 0,
    last_reviewed_date: today,
    next_review_date: addDaysISO(1, new Date(`${today}T12:00:00Z`)),
  };
}

/** What completing a review sets on the row. */
export function markReviewedPatch(portion, today = todayISO()) {
  const level = nextReviewLevel(portion.review_level || 0);
  return {
    review_level: level,
    last_reviewed_date: today,
    next_review_date: addDaysISO(intervalForLevel(level), new Date(`${today}T12:00:00Z`)),
  };
}

/** Groups portions for the UI. Never flags a portion as "overdue" or broken — a late review is just today's review. */
export function groupPortions(portions, today = todayISO()) {
  const memorizing = [];
  const dueToday = [];
  const onTrack = [];
  for (const p of portions) {
    if (p.status === "memorizing") memorizing.push(p);
    else if (!p.next_review_date || p.next_review_date <= today) dueToday.push(p);
    else onTrack.push(p);
  }
  return { memorizing, dueToday, onTrack };
}
