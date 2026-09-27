import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import AIPageTabs from "@/components/AIPageTabs";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function AIPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{strings.ai.brand}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{strings.ai.subtitle}</p>
        </div>

        <AIPageTabs userId={user.id} strings={strings} locale={locale} />
      </main>
    </div>
  );
}
