import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import ReviewTabs from "@/components/ReviewTabs";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO, weekStartISO } from "@/lib/time";

export default async function ReviewPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const { data: todayReview } = await supabase
    .from("evening_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("review_date", today)
    .maybeSingle();

  const { data: weekReview } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStartISO())
    .maybeSingle();

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/growth" className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-1">‹ {strings.nav.growth}</Link>
          <h1 className="font-display text-3xl">📊 {strings.growthHub.review}</h1>
        </div>
        <ReviewTabs userId={user.id} todayReview={todayReview} weekReview={weekReview} strings={strings} />
      </main>
    </div>
  );
}
