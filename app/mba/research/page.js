import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import ResearchWorkspace from "@/components/ResearchWorkspace";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function MbaResearchPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: research }, { data: notes }, { data: courses }] = await Promise.all([
    supabase.from("research_projects").select("*").eq("user_id", user.id).eq("program", "mba").order("created_at", { ascending: false }),
    supabase.from("research_notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("mba_courses").select("id, name").eq("user_id", user.id).eq("program", "mba"),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">{strings.mba.research}</h1>
        <ResearchWorkspace
          userId={user.id}
          initialResearch={research || []}
          initialNotes={notes || []}
          courses={courses || []}
          strings={strings}
        />
      </main>
    </div>
  );
}
