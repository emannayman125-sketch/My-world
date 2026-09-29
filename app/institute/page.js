import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO } from "@/lib/time";

export default async function InstituteHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const m = strings.instituteHub;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const { data: courses } = await supabase
    .from("mba_courses")
    .select("id")
    .eq("user_id", user.id)
    .eq("program", "institute");

  const courseIds = (courses || []).map((c) => c.id);
  const { data: assignments } = courseIds.length
    ? await supabase
        .from("mba_assignments")
        .select("id, title, due_date, status")
        .in("course_id", courseIds)
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(5)
    : { data: [] };

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/learning" className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-1">
            ‹ {strings.nav.learning}
          </Link>
          <h1 className="font-display text-3xl">{m.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{m.subtitle}</p>
        </div>

        <Link href="/institute/courses" className="card card-hover p-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
            <GraduationCap size={18} strokeWidth={2} />
          </span>
          <div className="flex-1">
            <p className="font-medium text-sm">{m.courses}</p>
            <p className="text-xs text-ink-muted dark:text-moon-muted">{(courses || []).length}</p>
          </div>
          <Arrow size={16} className="text-ink-muted/60" />
        </Link>

        <div className="card p-6">
          <h2 className="font-display text-xl mb-3">{m.upcomingAssignments}</h2>
          {(!assignments || assignments.length === 0) ? (
            <p className="text-sm text-ink-muted dark:text-moon-muted">{m.noAssignments}</p>
          ) : (
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className={a.due_date && a.due_date < today ? "text-red-500" : ""}>{a.title}</span>
                  <span className="text-xs text-ink-muted dark:text-moon-muted">{a.due_date || ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
