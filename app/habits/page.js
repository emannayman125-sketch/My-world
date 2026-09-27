import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import HabitsManager from "@/components/HabitsManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function HabitsPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const { data: logsToday } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("user_id", user.id)
    .eq("done_date", today);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/growth" className="text-xs text-ink-muted dark:text-moon-muted hover:text-lantern inline-flex items-center gap-1 mb-1">‹ {strings.nav.growth}</Link>
          <h1 className="font-display text-3xl">🔥 {strings.nav.habits}</h1>
        </div>
        <HabitsManager userId={user.id} initialHabits={habits || []} initialLogsToday={logsToday || []} strings={strings} />
      </main>
    </div>
  );
}
