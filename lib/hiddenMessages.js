// يحدد إذا كانت فيه رسالة مفاجئة "مستحقة" النهاردة، ويحدد أنواع الشروط:
// days_after_join | specific_date | first_goal_done | manual (لا تُفعّل تلقائيًا)
export async function getDueHiddenMessage(supabase, user) {
  const { data: pending } = await supabase
    .from("hidden_messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_delivered", false);

  if (!pending || pending.length === 0) return null;

  const joinedAt = new Date(user.created_at);
  const now = new Date();
  const daysSinceJoin = Math.floor((now - joinedAt) / (1000 * 60 * 60 * 24));
  const todayISO = now.toISOString().slice(0, 10);

  for (const msg of pending) {
    if (msg.trigger_type === "days_after_join") {
      if (daysSinceJoin >= Number(msg.trigger_value)) return msg;
    } else if (msg.trigger_type === "specific_date") {
      if (todayISO >= msg.trigger_value) return msg;
    } else if (msg.trigger_type === "first_goal_done") {
      const { data: doneGoal } = await supabase
        .from("goals")
        .select("id")
        .eq("user_id", user.id)
        .eq("progress", 100)
        .limit(1)
        .maybeSingle();
      if (doneGoal) return msg;
    }
  }

  return null;
}
