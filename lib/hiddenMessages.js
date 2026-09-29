// Decides which surprise message (if any) is due for Ahmed right now.
//
// trigger_type values (a plain text column, so new types need no SQL change):
//   days_after_join | specific_date | first_goal_done   (original)
//   tasks_done      (value = N) once N tasks have ever been completed
//   habit_streak    (value = N) once any habit reaches an N-day streak
//   anytime         no condition: at most ONE per day, oldest first, only when
//                   nothing else is due (a gentle "thinking of you" drip)
//   manual          never delivered automatically
//
// Everything is compared as Cairo calendar days, not UTC timestamps.
import { todayISO } from "@/lib/time";
import { getActivityDates } from "@/lib/activityDates";
import { computeActivityStreak } from "@/lib/streaks";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const wholeNumber = (v, min) => {
  const raw = String(v ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= min ? n : null;
};
const positiveInt = (v) => wholeNumber(v, 1);

/**
 * @param {*} supabase
 * @param {{ id: string, created_at: string }} user
 * @param {{ shownToday?: boolean }} [opts]  shownToday: an "anytime" message was already opened today
 */
export async function getDueHiddenMessage(supabase, user, opts = {}) {
  const { data: pending } = await supabase
    .from("hidden_messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_delivered", false)
    .order("created_at", { ascending: true });

  if (!pending || pending.length === 0) return null;

  const today = todayISO();
  const joinedDay = todayISO(new Date(user.created_at));
  const daysSinceJoin = Math.round((Date.parse(today) - Date.parse(joinedDay)) / 86400000);

  // Lazy, cached lookups: only hit the database for conditions that actually exist.
  let doneTaskCount = null;
  let maxStreak = null;
  let activityStreak = null;
  const tasksDone = async () => {
    if (doneTaskCount === null) {
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_done", true);
      doneTaskCount = count || 0;
    }
    return doneTaskCount;
  };
  const bestStreak = async () => {
    if (maxStreak === null) {
      const { data } = await supabase
        .from("habits")
        .select("current_streak")
        .eq("user_id", user.id)
        .order("current_streak", { ascending: false })
        .limit(1);
      maxStreak = data?.[0]?.current_streak || 0;
    }
    return maxStreak;
  };
  const currentActivityStreak = async () => {
    if (activityStreak === null) {
      const dates = await getActivityDates(supabase, user.id);
      activityStreak = computeActivityStreak(new Set(dates), today).current;
    }
    return activityStreak;
  };

  let anytimeCandidate = null;

  for (const msg of pending) {
    switch (msg.trigger_type) {
      case "days_after_join": {
        const n = wholeNumber(msg.trigger_value, 0); // 0 = "as soon as he starts"
        if (n !== null && daysSinceJoin >= n) return msg;
        break;
      }
      case "specific_date": {
        // A malformed date must never make a message fire early.
        const v = String(msg.trigger_value || "").trim();
        if (DATE_RE.test(v) && today >= v) return msg;
        break;
      }
      case "first_goal_done": {
        const { data: doneGoal } = await supabase
          .from("goals")
          .select("id")
          .eq("user_id", user.id)
          .eq("progress", 100)
          .limit(1)
          .maybeSingle();
        if (doneGoal) return msg;
        break;
      }
      case "tasks_done": {
        const n = positiveInt(msg.trigger_value);
        if (n !== null && (await tasksDone()) >= n) return msg;
        break;
      }
      case "habit_streak": {
        const n = positiveInt(msg.trigger_value);
        if (n !== null && (await bestStreak()) >= n) return msg;
        break;
      }
      case "activity_streak": {
        const n = positiveInt(msg.trigger_value);
        if (n !== null && (await currentActivityStreak()) >= n) return msg;
        break;
      }
      case "anytime": {
        if (!anytimeCandidate) anytimeCandidate = msg; // oldest first, thanks to the ordering above
        break;
      }
      default:
        break; // manual / unknown: never automatic
    }
  }

  if (anytimeCandidate && !opts.shownToday) return anytimeCandidate;
  return null;
}
