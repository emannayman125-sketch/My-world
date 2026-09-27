import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import CoursesManager from "@/components/CoursesManager";
import AssignmentsManager from "@/components/AssignmentsManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function MbaCoursesPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: courses }, { data: assignments }] = await Promise.all([
    supabase.from("mba_courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("mba_assignments").select("*").eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-8">
        <h1 className="font-display text-3xl">{strings.mba.courses}</h1>

        <CoursesManager userId={user.id} initialCourses={courses || []} strings={strings} />

        <div>
          <h2 className="font-display text-xl mb-3">{strings.mba.upcomingAssignments}</h2>
          <AssignmentsManager
            userId={user.id}
            initialAssignments={assignments || []}
            courses={courses || []}
            strings={strings}
          />
        </div>
      </main>
    </div>
  );
}
