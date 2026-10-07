import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Globe, Users, Lock } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
export default async function PrivacyPage() {
  const locale = getLocale();
  const strings = t(locale);
  const p = strings.privacy;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: link }, { data: sharedTasks }, { data: sharedGoals }] =
    await Promise.all([
      supabase.from("profiles").select("username").eq("id", user.id).single(),
      supabase.from("partner_links").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("tasks").select("id").eq("user_id", user.id).eq("is_shared", true),
      supabase.from("goals").select("id").eq("user_id", user.id).eq("is_shared", true),
    ]);

  let partnerStatus = p.partnerNone;
  if (link?.status === "accepted") partnerStatus = p.partnerActive;
  else if (link?.status === "pending") partnerStatus = p.partnerPending;

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{p.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{p.subtitle}</p>
        </div>

        <div className="card p-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
            <ShieldCheck size={17} strokeWidth={2} />
          </span>
          <p className="text-sm">{p.defaultPrivate}</p>
        </div>

        {/* Pointer to the dedicated Public Profile section */}
        <Link
          href="/public-profile"
          className="card card-hover p-6 flex items-center gap-4"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
            <Globe size={20} strokeWidth={2} />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-xl">{p.publicSection}</h2>
            <p className="text-sm text-ink-muted dark:text-moon-muted mt-0.5">{p.publicExplain}</p>
          </div>
        </Link>

        {/* Shared */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Users size={18} strokeWidth={2} className="text-dusk" /> {p.sharedSection}
          </h2>
          <p className="text-sm text-ink-muted dark:text-moon-muted">{p.sharedExplain}</p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            <div className="flex items-center justify-between py-2 text-sm">
              <span>{partnerStatus}</span>
              <Link href="/partner" className="text-xs text-sage dark:text-sage-soft underline">{p.manage}</Link>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span>{p.sharedTasks}</span>
              <span className="text-ink-muted dark:text-moon-muted">{sharedTasks?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span>{p.sharedGoals}</span>
              <span className="text-ink-muted dark:text-moon-muted">{sharedGoals?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Always private */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Lock size={18} strokeWidth={2} className="text-ink-muted dark:text-moon-muted" /> {p.alwaysPrivateSection}
          </h2>
          <p className="text-sm text-ink-muted dark:text-moon-muted">{p.alwaysPrivateExplain}</p>
          <ul className="text-sm space-y-1.5 list-disc ps-5">
            {Object.values(p.alwaysPrivateList).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
