import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import ContentManager from "@/components/ContentManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function CreatorStudioPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("content_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="studio-label mb-1">CREATOR STUDIO</p>
          <h1 className="font-display text-3xl">{strings.creator.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{strings.creator.subtitle}</p>
        </div>
        <ContentManager userId={user.id} initialItems={items || []} strings={strings} />
      </main>
    </div>
  );
}
