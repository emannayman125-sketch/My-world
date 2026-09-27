// بيحسب الـ Streak الحقيقي: عدد الأيام المتتالية بدون انقطاع (مش مجرد عداد بيزيد كل مرة)
export function computeStreakFromDates(doneDates) {
  const set = new Set(doneDates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayISO = cursor.toISOString().slice(0, 10);
  if (!set.has(todayISO)) {
    // لو النهاردة لسه ما اتعملتش، نبدأ العد من إمبارح (عشان ما نصفرش الستريك لحد آخر اليوم)
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// بيجيب تاريخ العادة (آخر 90 يوم كفاية لأي ستريك واقعي)، يحسب الستريك الصح، ويحفظه
export async function recomputeAndSaveStreak(supabase, habitId, userId) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("done_date")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .gte("done_date", since.toISOString().slice(0, 10));

  const streak = computeStreakFromDates((logs || []).map((l) => l.done_date));

  await supabase.from("habits").update({ current_streak: streak }).eq("id", habitId);

  return streak;
}
