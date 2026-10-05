import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Globe, Users, Lock } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import PublicProfileManager from "@/components/PublicProfileManager";

export default async function PrivacyPage() {
  const locale = getLocale();
  const strings = t(locale);
  const p = strings.privacy;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: interests }, { data: currently }, { data: world }, { data: link }, { data: sharedTasks }, { data: sharedGoals }] =
    await Promise.all([
      supabase.from("profiles").select("username, is_bio_public, social_links").eq("id", user.id).single(),
      supabase.from("interests").select("id, value, is_public").eq("user_id", user.id),
      supabase.from("currently_items").select("id, kind, title, is_public").eq("user_id", user.id),
      supabase.from("world_items").select("id, kind, title, subtitle, is_public").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("partner_links").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("tasks").select("id").eq("user_id", user.id).eq("is_shared", true),
      supabase.from("goals").select("id").eq("user_id", user.id).eq("is_shared", true),
    ]);

  const bioRow = {
    label: p.bio,
    value: profile?.is_bio_public ? `1/1 ${p.publicOf}` : `0/1 ${p.publicOf}`,
    href: "/settings",
  };

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

        {/* Public */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Globe size={18} strokeWidth={2} className="text-sage dark:text-sage-soft" /> {p.publicSection}
          </h2>
          <p className="text-sm text-ink-muted dark:text-moon-muted">{p.publicExplain}</p>
          {profile?.username ? (
            <Link
              href={`/u/${profile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 text-sage dark:text-sage-soft text-sm px-4 py-2 hover:bg-sage/25 transition"
            >
              {p.previewLink} ↗
            </Link>
          ) : (
            <p className="text-sm text-ink-muted dark:text-moon-muted">{p.noUsername}</p>
          )}
          <div className="flex items-center justify-between py-2 text-sm border-b border-black/5 dark:border-white/10">
            <span>{bioRow.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-ink-muted dark:text-moon-muted">{bioRow.value}</span>
              <Link href={bioRow.href} className="text-xs text-sage dark:text-sage-soft underline">{p.manage}</Link>
            </div>
          </div>

          <PublicProfileManager
            userId={user.id}
            initialWorld={world || []}
            initialCurrently={currently || []}
            initialInterests={interests || []}
            strings={p.publicManager}
            worldKindLabels={strings.legacy.world.kinds}
            currentlyKindLabels={strings.legacy.currently.kinds}
          />
        </div>

        {/* Social links: exactly what he chooses to share, nothing else */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Globe size={18} strokeWidth={2} className="text-sage dark:text-sage-soft" /> {p.socialLinksTitle}
          </h2>
          <SocialLinksEditor userId={user.id} initialLinks={profile?.social_links} strings={p.socialLinks} />
        </div>

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
