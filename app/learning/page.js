import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Library as LibraryIcon, FlaskConical, Languages, BookMarked, BookOpenCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function LearningHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const l = strings.learningHub;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: quranPortions }, { data: courses }, { data: instituteCourses }, { data: books }, { data: research }, { data: sessions }] = await Promise.all([
    supabase.from("quran_portions").select("id").eq("user_id", user.id),
    supabase.from("mba_courses").select("id").eq("user_id", user.id).eq("program", "mba"),
    supabase.from("mba_courses").select("id").eq("user_id", user.id).eq("program", "institute"),
    supabase.from("library_books").select("id").eq("user_id", user.id),
    supabase.from("research_projects").select("id").eq("user_id", user.id),
    supabase.from("english_sessions").select("id").eq("user_id", user.id),
  ]);

  const cards = [
    { href: "/quran", icon: BookOpenCheck, accent: "#2E8B63", title: l.quran, desc: l.quranDesc, count: (quranPortions || []).length },
    { href: "/mba", icon: GraduationCap, accent: "#547DA5", title: l.mba, desc: l.mbaDesc, count: (courses || []).length },
    { href: "/institute", icon: BookMarked, accent: "#6F4FC4", title: l.institute, desc: l.instituteDesc, count: (instituteCourses || []).length },
    { href: "/library", icon: LibraryIcon, accent: "#547DA5", title: l.library, desc: l.libraryDesc, count: (books || []).length },
    { href: "/mba/research", icon: FlaskConical, accent: "#547DA5", title: l.research, desc: l.researchDesc, count: (research || []).length },
    { href: "/english", icon: Languages, accent: "#547DA5", title: l.english, desc: l.englishDesc, count: (sessions || []).length },
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{l.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{l.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="card card-hover p-5 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                style={{ backgroundColor: `${c.accent}30`, color: c.accent }}
              >
                <c.icon size={18} strokeWidth={2} />
              </span>
              <div className="flex-1">
                <p className="font-medium text-sm">{c.title}</p>
                <p className="text-xs text-ink-muted dark:text-moon-muted">{c.desc}</p>
              </div>
              <span className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{c.count}</span>
              <Arrow size={16} className="text-ink-muted/60 shrink-0" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
