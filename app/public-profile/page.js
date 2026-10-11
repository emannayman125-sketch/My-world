import { redirect } from "next/navigation";
import Link from "next/link";
import { Globe, Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import PublicProfileManager from "@/components/PublicProfileManager";
import SectionOrderManager from "@/components/SectionOrderManager";

// Its own dedicated home, not a tab buried inside general privacy settings —
// everything about the page strangers see, in one place: what's public,
// what order it's in, and how to find/preview it.
export default async function PublicProfilePage() {
  const locale = getLocale();
  const strings = t(locale);
  const p = strings.privacy;
  const pp = p.publicProfilePage;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: interests }, { data: currently }, { data: world }] = await Promise.all([
    supabase.from("profiles").select("username, is_bio_public, social_links, public_section_order").eq("id", user.id).single(),
    supabase.from("interests").select("id, value, is_public").eq("user_id", user.id),
    supabase.from("currently_items").select("id, kind, title, is_public").eq("user_id", user.id),
    supabase.from("world_items").select("id, kind, title, subtitle, is_public").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const bioRow = {
    label: p.bio,
    value: profile?.is_bio_public ? `1/1 ${p.publicOf}` : `0/1 ${p.publicOf}`,
    href: "/settings",
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div className="rounded-card bg-sage/[0.06] dark:bg-sage/[0.1] border border-sage/20 p-6 space-y-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div>
            <h1 className="font-display text-3xl">{pp.title}</h1>
            <p className="text-ink-muted dark:text-moon-muted mt-1">{pp.subtitle}</p>
          </div>
          {profile?.username ? (
            <Link
              href={`/u/${profile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full bg-sage text-white text-sm font-medium px-5 py-2.5 shadow-lantern hover:brightness-105 transition"
            >
              {p.previewLink} ↗
            </Link>
          ) : (
            <p className="text-sm text-ink-muted dark:text-moon-muted">{p.noUsername}</p>
          )}
        </div>

        {/* Public toggles */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Globe size={18} strokeWidth={2} className="text-sage dark:text-sage-soft" /> {p.publicSection}
          </h2>
          <p className="text-sm text-ink-muted dark:text-moon-muted">{p.publicExplain}</p>
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
            currentlyKindLabels={strings.dashboard.currently.kinds}
          />
        </div>

        {/* Section order */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl">{p.sectionOrderTitle}</h2>
          <p className="text-sm text-ink-muted dark:text-moon-muted">{p.sectionOrderHint}</p>
          <SectionOrderManager
            userId={user.id}
            initialOrder={profile?.public_section_order || ["currently", "books", "podcasts", "interests", "about", "social"]}
            strings={p.sectionOrder}
          />
        </div>

        {/* Social links */}
        <div className="card p-6 space-y-3">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Globe size={18} strokeWidth={2} className="text-sage dark:text-sage-soft" /> {p.socialLinksTitle}
          </h2>
          <SocialLinksEditor userId={user.id} initialLinks={profile?.social_links} strings={p.socialLinks} />
        </div>

        <Link href="/privacy" className="inline-block text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon underline">
          {pp.backToPrivacy}
        </Link>
      </main>
    </div>
  );
}
