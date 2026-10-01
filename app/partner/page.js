import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import PartnerManager from "@/components/PartnerManager";
import SharedProgress from "@/components/SharedProgress";
import TradingJournalManager from "@/components/TradingJournalManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function PartnerPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // نجيب أي رابط (طلب مستني، أو مقبول) — أي حالة غير كده متسحبتش
  const { data: link } = await supabase
    .from("partner_links")
    .select("*")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let otherProfile = null;
  let myGoals = [];
  let partnerGoals = [];
  let myCourses = [];
  let partnerCourses = [];
  let sharedAssignments = [];
  let partnerTrades = null;
  let partnerCanLog = false;

  if (link) {
    const otherId = link.user_a === user.id ? link.user_b : link.user_a;
    const { data: p } = await supabase
      .from("partner_profiles")
      .select("display_name, avatar_url")
      .eq("id", otherId)
      .maybeSingle();
    otherProfile = p;

    if (link.status === "accepted") {
      const { data: otherFullProfile } = await supabase
        .from("profiles")
        .select("trading_shared, trading_partner_can_log")
        .eq("id", otherId)
        .maybeSingle();

      if (otherFullProfile?.trading_shared) {
        const { data: trades } = await supabase
          .from("trading_journal")
          .select("*")
          .eq("user_id", otherId)
          .order("trade_date", { ascending: false });
        partnerTrades = trades || [];
        partnerCanLog = !!otherFullProfile.trading_partner_can_log;
      }

      const [{ data: mine }, { data: theirs }] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id).eq("is_shared", true),
        supabase.from("goals").select("*").eq("user_id", otherId).eq("is_shared", true),
      ]);
      myGoals = mine || [];
      partnerGoals = theirs || [];

      const [{ data: myC }, { data: theirC }] = await Promise.all([
        supabase.from("mba_courses").select("*").eq("user_id", user.id).eq("program", "institute").eq("is_shared", true),
        supabase.from("mba_courses").select("*").eq("user_id", otherId).eq("program", "institute").eq("is_shared", true),
      ]);
      myCourses = myC || [];
      partnerCourses = theirC || [];

      const sharedCourseIds = [...myCourses, ...partnerCourses].map((c) => c.id);
      if (sharedCourseIds.length > 0) {
        const { data: assignments } = await supabase
          .from("mba_assignments")
          .select("*, mba_courses(name)")
          .in("course_id", sharedCourseIds)
          .neq("status", "completed")
          .order("due_date", { ascending: true })
          .limit(10);
        sharedAssignments = assignments || [];
      }
    }
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">🤝 مشاركة مع شخص تاني</h1>

        <PartnerManager userId={user.id} link={link} otherProfile={otherProfile} />

        {link?.status === "accepted" && otherProfile && (
          <div>
            <p className="text-sm text-ink-muted dark:text-moon-muted mb-3">
              الأهداف اللي حددتوها كـ "مشتركة" (من صفحة الأهداف):
            </p>
            <SharedProgress
              myName={profile?.display_name || "أنت"}
              partnerName={otherProfile.display_name || "شريكك"}
              myItems={myGoals}
              partnerItems={partnerGoals}
            />
          </div>
        )}

        {link?.status === "accepted" && otherProfile && (myCourses.length > 0 || partnerCourses.length > 0) && (
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-xl">📖 مساحة المذاكرة المشتركة</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-2">
                  {profile?.display_name || "أنت"}
                </p>
                {myCourses.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-moon-muted">مفيش مواد مشتركة لسه.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {myCourses.map((c) => (
                      <li key={c.id} className="text-sm">
                        {c.name} {c.schedule && <span className="text-xs text-ink-muted dark:text-moon-muted">· {c.schedule}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-2">
                  {otherProfile.display_name || "شريكك"}
                </p>
                {partnerCourses.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-moon-muted">مفيش مواد مشتركة لسه.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {partnerCourses.map((c) => (
                      <li key={c.id} className="text-sm">
                        {c.name} {c.schedule && <span className="text-xs text-ink-muted dark:text-moon-muted">· {c.schedule}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {sharedAssignments.length > 0 && (
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-2">تسليمات قريبة</p>
                <ul className="space-y-1.5">
                  {sharedAssignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span>
                        {a.title}{" "}
                        <span className="text-xs text-ink-muted dark:text-moon-muted">· {a.mba_courses?.name}</span>
                      </span>
                      <span className="text-xs text-ink-muted dark:text-moon-muted">{a.due_date || ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {link?.status === "accepted" && otherProfile && partnerTrades !== null && (
          <div className="desk-card p-6 space-y-4">
            <h2 className="font-display text-xl text-white">
              {strings.trading.journal} — {otherProfile.display_name || strings.partner?.them || ""}
            </h2>
            <TradingJournalManager
              userId={link.user_a === user.id ? link.user_b : link.user_a}
              viewerId={user.id}
              readOnly={!partnerCanLog}
              initialTrades={partnerTrades}
              strings={strings}
            />
          </div>
        )}
      </main>
    </div>
  );
}
