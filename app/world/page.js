import { redirect } from "next/navigation";
import Link from "next/link";
import { Globe } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import WorldHubTabs from "@/components/WorldHubTabs";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

// Consolidated "Your world" hub -- was six separate pages/nav items
// (World, Interests, Journal, Memories, Messages, Time Capsule),
// now one page with internal tabs. See WorldHubTabs.jsx.
export default async function WorldPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [world, interests, journal, timeline, messages, timeCapsule] = await Promise.all([
    supabase.from("world_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("interests").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("notes").select("*").eq("user_id", user.id).neq("kind", "daily_brief").order("created_at", { ascending: false }),
    supabase.from("memories").select("*").eq("user_id", user.id).order("year", { ascending: true }),
    supabase.from("hidden_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("time_capsules").select("*").eq("user_id", user.id).order("reveal_date", { ascending: true }),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">{strings.nav.world}</h1>

        <Link href="/public-profile" className="card card-hover p-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
            <Globe size={18} strokeWidth={2} />
          </span>
          <div className="flex-1">
            <p className="font-medium text-sm">{strings.privacy.publicProfilePage.title}</p>
            <p className="text-xs text-ink-muted dark:text-moon-muted">{strings.privacy.publicProfilePage.subtitle}</p>
          </div>
        </Link>

        <WorldHubTabs
          userId={user.id}
          strings={strings}
          locale={locale}
          data={{
            world: world.data || [],
            interests: interests.data || [],
            journal: journal.data || [],
            timeline: timeline.data || [],
            messages: messages.data || [],
            timeCapsule: timeCapsule.data || [],
          }}
        />
      </main>
    </div>
  );
}
