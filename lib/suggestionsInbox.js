import { todayISO, addDaysISO } from "@/lib/time";

// Reconciles today's Daily Brief focus items with the suggestions inbox:
// anything not already logged today gets recorded once, either as
// "pending" (default) or, if he's turned on the one real autonomy setting,
// auto-added straight to today's top 3 (when a slot is free) and logged
// as "accepted". Safe to call on every request — already-logged titles
// are never touched twice.
export async function reconcileDailyFocusSuggestions(supabase, userId, focusItems) {
  const today = todayISO();
  // Fetch a safely wide window (Cairo's UTC offset is at most a few hours either
  // way) and filter to today's Cairo calendar day precisely in JS below, rather
  // than guessing a UTC boundary for "Cairo midnight".
  const safeWindowStart = `${addDaysISO(-1)}T00:00:00.000Z`;

  const [{ data: recent }, { data: top3 }, { data: profile }] = await Promise.all([
    supabase
      .from("ai_suggestions")
      .select("title, status, created_at")
      .eq("user_id", userId)
      .eq("source", "daily_brief")
      .gte("created_at", safeWindowStart),
    supabase.from("top3_tasks").select("title").eq("user_id", userId).eq("for_date", today),
    supabase.from("profiles").select("auto_add_daily_focus").eq("id", userId).maybeSingle(),
  ]);

  const existingToday = (recent || []).filter((r) => todayISO(new Date(r.created_at)) === today);
  const alreadyLogged = new Set(existingToday.map((r) => r.title));
  const top3Titles = new Set((top3 || []).map((t) => t.title));
  const autoOn = !!profile?.auto_add_daily_focus;
  let freeSlots = Math.max(0, 3 - top3Titles.size);

  const autoAdded = [];
  const toInsert = [];

  for (const item of focusItems || []) {
    if (!item?.title || alreadyLogged.has(item.title) || top3Titles.has(item.title)) continue;

    if (autoOn && freeSlots > 0) {
      const { error } = await supabase.from("top3_tasks").insert({ user_id: userId, title: item.title, for_date: today });
      if (error) {
        // The insert into top3_tasks failed -- don't log this as "accepted" (the
        // "🪄 Auto-added" badge would then claim a task exists that never actually
        // landed in the DB). Fall back to a plain pending suggestion instead.
        toInsert.push({ user_id: userId, source: "daily_brief", kind: "task", title: item.title, subtitle: item.why || null, status: "pending" });
        continue;
      }
      toInsert.push({ user_id: userId, source: "daily_brief", kind: "task", title: item.title, subtitle: item.why || null, status: "accepted" });
      autoAdded.push(item.title);
      freeSlots--;
    } else {
      toInsert.push({ user_id: userId, source: "daily_brief", kind: "task", title: item.title, subtitle: item.why || null, status: "pending" });
    }
  }

  if (toInsert.length > 0) {
    await supabase.from("ai_suggestions").insert(toInsert);
  }

  // Titles auto-added on an EARLIER call today (e.g. a page refresh) still need the tag.
  const previouslyAutoAdded = (existingToday || []).filter((r) => r.status === "accepted").map((r) => r.title);

  return { autoAdded: [...previouslyAutoAdded, ...autoAdded] };
}
