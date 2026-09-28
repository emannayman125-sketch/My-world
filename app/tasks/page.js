import { redirect } from "next/navigation";
import { todayISO as todayCairo, addDaysISO } from "@/lib/time";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import ProductivityHubTabs from "@/components/ProductivityHubTabs";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

// Consolidated Productivity hub -- was four separate pages/nav items
// (Tasks, Priority Matrix, Planner, Reset the day), now one page with
// internal tabs. See ProductivityHubTabs.jsx.
export default async function TasksPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const todayISO = todayCairo();
  const yesterdayISO = addDaysISO(-1);

  const [
    tasksRes,
    matrixTasksRes,
    eventsRes,
    yesterdayTasksRes,
    todayTasksRes,
    todayEventsRes,
  ] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("user_id", user.id).eq("is_done", false).order("created_at", { ascending: false }),
    supabase.from("events").select("*").eq("user_id", user.id).order("event_date", { ascending: true }),
    supabase.from("top3_tasks").select("*").eq("user_id", user.id).eq("for_date", yesterdayISO),
    supabase.from("top3_tasks").select("id").eq("user_id", user.id).eq("for_date", todayISO),
    supabase.from("events").select("*").eq("user_id", user.id).eq("event_date", todayISO).order("event_time", { ascending: true }),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">{strings.nav.tasks}</h1>
        <ProductivityHubTabs
          userId={user.id}
          strings={strings}
          locale={locale}
          data={{
            tasks: tasksRes.data || [],
            matrixTasks: matrixTasksRes.data || [],
            events: eventsRes.data || [],
            yesterdayTasks: yesterdayTasksRes.data || [],
            todayCount: (todayTasksRes.data || []).length,
            todayEvents: todayEventsRes.data || [],
          }}
        />
      </main>
    </div>
  );
}
