import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Flame, BarChart3, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function GrowthHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const g = strings.growthHub;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: goals }, { data: habits }] = await Promise.all([
    supabase.from("goals").select("id").eq("user_id", user.id),
    supabase.from("habits").select("id").eq("user_id", user.id),
  ]);

  const cards = [
    { href: "/goals", icon: Trophy, accent: "#B5624A", title: g.goals, desc: g.goalsDesc, count: (goals || []).length },
    { href: "/habits", icon: Flame, accent: "#6E8558", title: g.habits, desc: g.habitsDesc, count: (habits || []).length },
    { href: "/review", icon: BarChart3, accent: "#68788A", title: g.review, desc: g.reviewDesc, count: null },
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{g.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{g.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
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
              {c.count !== null && <span className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{c.count}</span>}
              <Arrow size={16} className="text-ink-muted/60 shrink-0" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
