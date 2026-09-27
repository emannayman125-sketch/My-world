import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function MbaHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const m = strings.mba;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: courses }, { data: assignments }, { data: research }] = await Promise.all([
    supabase.from("mba_courses").select("id, name").eq("user_id", user.id),
    supabase
      .from("mba_assignments")
      .select("id, title, due_date, status")
      .eq("user_id", user.id)
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(5),
    supabase.from("research_projects").select("id, status").eq("user_id", user.id),
  ]);

  const activeResearchCount = (research || []).filter((r) => r.status !== "finished").length;

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/learning" className="text-xs text-ink-muted dark:text-moon-muted hover:text-lantern inline-flex items-center gap-1 mb-1">‹ {strings.nav.learning}</Link>
          <h1 className="font-display text-3xl">{m.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{m.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/mba/courses" className="card card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lantern/15 text-lantern shrink-0">
              <GraduationCap size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{m.courses}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{(courses || []).length}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>

          <Link href="/mba/research" className="card card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dusk/15 text-dusk shrink-0">
              <BookOpen size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{m.research}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{activeResearchCount}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl mb-3">{m.upcomingAssignments}</h2>
          {(!assignments || assignments.length === 0) ? (
            <p className="text-sm text-ink-muted dark:text-moon-muted">{m.noAssignments}</p>
          ) : (
            <ul className="space-y-2">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className={a.due_date && a.due_date < today ? "text-red-500" : ""}>
                    {a.title}
                  </span>
                  <span className="text-xs text-ink-muted dark:text-moon-muted">
                    {a.due_date || ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
