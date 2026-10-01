import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import TradingJournalManager from "@/components/TradingJournalManager";
import TradingSessionPanel from "@/components/TradingSessionPanel";
import TradingShareSettings from "@/components/TradingShareSettings";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO } from "@/lib/time";

export default async function JournalPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();

  const [{ data: trades }, { data: session }, { data: profile }, { data: link }] = await Promise.all([
    supabase.from("trading_journal").select("*").eq("user_id", user.id).order("trade_date", { ascending: false }),
    supabase.from("trading_sessions").select("*").eq("user_id", user.id).eq("session_date", today).maybeSingle(),
    supabase.from("profiles").select("trading_shared, trading_partner_can_log").eq("id", user.id).single(),
    supabase.from("partner_links").select("*").eq("status", "accepted")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`).maybeSingle(),
  ]);

  let partnerName = null;
  if (link) {
    const otherId = link.user_a === user.id ? link.user_b : link.user_a;
    const { data: p } = await supabase.from("partner_profiles").select("display_name").eq("id", otherId).maybeSingle();
    partnerName = p?.display_name || null;
  }

  const todayTrades = (trades || []).filter((t) => t.trade_date === today);

  return (
    <div className="desk-shell lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">{strings.trading.journal}</h1>

        <div className="desk-card p-5">
          <h2 className="font-display text-lg mb-3">{strings.trading.sharing.title}</h2>
          <TradingShareSettings
            userId={user.id}
            partnerName={partnerName}
            initialShared={profile?.trading_shared}
            initialCanLog={profile?.trading_partner_can_log}
            strings={strings.trading.sharing}
          />
        </div>
        <TradingSessionPanel
          userId={user.id}
          initialSession={session}
          todayTrades={todayTrades}
          strings={strings.trading}
        />
        <TradingJournalManager userId={user.id} initialTrades={trades || []} strings={strings} />
      </main>
    </div>
  );
}
