import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import IdeasManager from "@/components/IdeasManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function BusinessIdeasPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ideas } = await supabase
    .from("business_ideas").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="exec-label mb-1">BUSINESS HUB</p>
          <h1 className="font-display text-3xl">{strings.business.ideas}</h1>
        </div>
        <IdeasManager userId={user.id} initialIdeas={ideas || []} strings={strings} />
      </main>
    </div>
  );
}
