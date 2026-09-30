import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Lightbulb, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function BusinessHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const b = strings.business;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: projects }, { data: contacts }, { data: ideas }] = await Promise.all([
    supabase.from("business_projects").select("id, status").eq("user_id", user.id),
    supabase.from("business_contacts").select("id").eq("user_id", user.id),
    supabase.from("business_ideas").select("id").eq("user_id", user.id),
  ]);

  const activeProjects = (projects || []).filter((p) => p.status === "active").length;

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
        <div>
          <p className="exec-label mb-1">BUSINESS HUB</p>
          <Link href="/business-operations" className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-1">‹ {strings.nav.businessOps}</Link>
          <h1 className="font-display text-3xl">{b.title}</h1>
        </div>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{b.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/business/projects" className="exec-card exec-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay/15 text-clay dark:text-clay-soft shrink-0">
              <Building2 size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{b.projects}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{activeProjects}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>

          <Link href="/business/contacts" className="exec-card exec-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dusk/15 text-dusk shrink-0">
              <Users size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{b.contacts}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{(contacts || []).length}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>

          <Link href="/business/ideas" className="exec-card exec-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-500 shrink-0">
              <Lightbulb size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{b.ideas}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{(ideas || []).length}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>
        </div>
      </main>
    </div>
  );
}
