import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import GoalsManager from "@/components/GoalsManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function GoalsPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/growth" className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-1">‹ {strings.nav.growth}</Link>
          <h1 className="font-display text-3xl">🏆 {strings.nav.goals}</h1>
        </div>
        <GoalsManager userId={user.id} initialGoals={goals || []} strings={strings} />
      </main>
    </div>
  );
}
