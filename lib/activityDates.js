import { addDaysISO, todayISO } from "@/lib/time";

// Collects the days on which Ahmed "showed up", from several tables, as a
// list of "YYYY-MM-DD" Cairo dates. Only DATES are read (never journal text),
// and a failed query just contributes nothing.
export async function getActivityDates(supabase, userId, days = 180) {
  const since = addDaysISO(-days);
  const sinceTs = new Date(Date.now() - days * 86400000).toISOString();

  const rows = async (builder) => {
    try {
      const r = await builder;
      return r?.data || [];
    } catch {
      return [];
    }
  };

  const [habitLogs, top3, reviews, english, journal, trades] = await Promise.all([
    rows(supabase.from("habit_logs").select("done_date").eq("user_id", userId).gte("done_date", since).order("done_date", { ascending: false }).limit(1000)),
    rows(supabase.from("top3_tasks").select("for_date").eq("user_id", userId).eq("is_done", true).gte("for_date", since).limit(1000)),
    rows(supabase.from("evening_reviews").select("review_date").eq("user_id", userId).gte("review_date", since).limit(1000)),
    rows(supabase.from("english_sessions").select("created_at").eq("user_id", userId).gte("created_at", sinceTs).limit(1000)),
    rows(supabase.from("notes").select("created_at").eq("user_id", userId).eq("kind", "journal").gte("created_at", sinceTs).limit(1000)),
    rows(supabase.from("trading_journal").select("trade_date").eq("user_id", userId).gte("trade_date", since).limit(1000)),
  ]);

  const set = new Set();
  habitLogs.forEach((r) => r.done_date && set.add(r.done_date));
  top3.forEach((r) => r.for_date && set.add(r.for_date));
  reviews.forEach((r) => r.review_date && set.add(r.review_date));
  trades.forEach((r) => r.trade_date && set.add(r.trade_date));
  // timestamps -> Cairo calendar day
  english.forEach((r) => r.created_at && set.add(todayISO(new Date(r.created_at))));
  journal.forEach((r) => r.created_at && set.add(todayISO(new Date(r.created_at))));

  return [...set];
}
