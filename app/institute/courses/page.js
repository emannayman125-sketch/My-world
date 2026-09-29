import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import CoursesManager from "@/components/CoursesManager";
import AssignmentsManager from "@/components/AssignmentsManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function InstituteCoursesPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: courses }, { data: link }] = await Promise.all([
    supabase
      .from("mba_courses")
      .select("*")
      .eq("user_id", user.id)
      .eq("program", "institute")
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_links")
      .select("*")
      .eq("status", "accepted")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .limit(1)
      .maybeSingle(),
  ]);

  const courseIds = (courses || []).map((c) => c.id);
  const { data: assignments } = courseIds.length
    ? await supabase.from("mba_assignments").select("*").in("course_id", courseIds)
    : { data: [] };

  let partnerName = "";
  if (link) {
    const otherId = link.user_a === user.id ? link.user_b : link.user_a;
    const { data: p } = await supabase
      .from("partner_profiles")
      .select("display_name")
      .eq("id", otherId)
      .maybeSingle();
    partnerName = p?.display_name || "";
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-8">
        <h1 className="font-display text-3xl">{strings.instituteHub.courses}</h1>

        <CoursesManager
          userId={user.id}
          initialCourses={courses || []}
          strings={strings}
          program="institute"
          partnerName={partnerName}
        />

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
