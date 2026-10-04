import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Library as LibraryIcon, FlaskConical, Languages, BookMarked, BookOpenCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import Collapsible from "@/components/Collapsible";
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

  // Primary: the parts of Ahmed's actual week (Quran, MBA, the institute).
  // Secondary: still fully there and addable any time, just not fighting
  // for attention when they sit empty between visits.
  const primaryCards = [
    { href: "/quran", icon: BookOpenCheck, accent: "#2E8B63", title: l.quran, desc: l.quranDesc, count: (quranPortions || []).length },
    { href: "/mba", icon: GraduationCap, accent: "#547DA5", title: l.mba, desc: l.mbaDesc, count: (courses || []).length },
    { href: "/institute", icon: BookMarked, accent: "#6F4FC4", title: l.institute, desc: l.instituteDesc, count: (instituteCourses || []).length },
  ];
  const secondaryCards = [
    { href: "/library", icon: LibraryIcon, title: l.library, desc: l.libraryDesc, count: (books || []).length },
    { href: "/mba/research", icon: FlaskConical, title: l.research, desc: l.researchDesc, count: (research || []).length },
    { href: "/english", icon: Languages, title: l.english, desc: l.englishDesc, count: (sessions || []).length },
  ];
  const secondaryTotal = secondaryCards.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{l.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{l.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {primaryCards.map((c) => (
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

        <Collapsible
          title={l.moreResources}
          summary={secondaryTotal > 0 ? `${secondaryTotal}` : l.moreResourcesEmpty}
        >
          <div className="space-y-2">
            {secondaryCards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="flex items-center gap-3 rounded-soft px-2 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted shrink-0">
                  <c.icon size={15} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{c.title}</p>
                  <p className="text-xs text-ink-muted dark:text-moon-muted truncate">{c.desc}</p>
                </div>
                <span className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{c.count}</span>
                <Arrow size={14} className="text-ink-muted/50 shrink-0" />
              </Link>
            ))}
          </div>
        </Collapsible>
      </main>
    </div>
  );
}
