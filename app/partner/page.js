import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import PartnerManager from "@/components/PartnerManager";
import SharedProgress from "@/components/SharedProgress";

export default async function PartnerPage() {
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

  if (link) {
    const otherId = link.user_a === user.id ? link.user_b : link.user_a;
    const { data: p } = await supabase
      .from("partner_profiles")
      .select("display_name, avatar_url")
      .eq("id", otherId)
      .maybeSingle();
    otherProfile = p;

    if (link.status === "accepted") {
      const [{ data: mine }, { data: theirs }] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id).eq("is_shared", true),
        supabase.from("goals").select("*").eq("user_id", otherId).eq("is_shared", true),
      ]);
      myGoals = mine || [];
      partnerGoals = theirs || [];
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
      </main>
    </div>
  );
}
