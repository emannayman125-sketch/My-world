import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import GrowthHubTabs from "@/components/GrowthHubTabs";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO, weekStartISO } from "@/lib/time";

// Consolidated Growth hub -- was three separate pages/nav destinations
// (Goals, Habits, Review), now one page with internal tabs. See
// GrowthHubTabs.jsx.
export default async function GrowthHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const g = strings.growthHub;
  const today = todayISO();

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: goals },
    { data: habits },
    { data: habitLogsToday },
    { data: todayReview },
    { data: weekReview },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("done_date", today),
    supabase.from("evening_reviews").select("*").eq("user_id", user.id).eq("review_date", today).maybeSingle(),
    supabase.from("weekly_reviews").select("*").eq("user_id", user.id).eq("week_start", weekStartISO()).maybeSingle(),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{g.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{g.subtitle}</p>
        </div>
        <GrowthHubTabs
          userId={user.id}
          strings={strings}
          data={{
            goals: goals || [],
            habits: habits || [],
            habitLogsToday: habitLogsToday || [],
            todayReview,
            weekReview,
          }}
        />
      </main>
    </div>
  );
}
