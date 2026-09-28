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
