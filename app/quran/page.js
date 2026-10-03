import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import QuranTracker from "@/components/QuranTracker";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { addDaysISO, todayISO } from "@/lib/time";

export default async function QuranPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weekAgo = addDaysISO(-7);

  const [{ data: portions }, { data: events }] = await Promise.all([
    supabase.from("quran_portions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("quran_events").select("kind, event_date").eq("user_id", user.id).gte("event_date", weekAgo),
  ]);

  const weekly = {
    memorized: (events || []).filter((e) => e.kind === "memorized").length,
    reviewed: (events || []).filter((e) => e.kind === "reviewed").length,
    studyDays: new Set((events || []).map((e) => e.event_date)).size,
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{strings.quran.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{strings.quran.subtitle}</p>
        </div>
        <QuranTracker userId={user.id} initialPortions={portions || []} initialWeekly={weekly} strings={strings.quran} />
      </main>
    </div>
  );
}
