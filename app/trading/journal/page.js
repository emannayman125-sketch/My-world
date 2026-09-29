import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import TradingJournalManager from "@/components/TradingJournalManager";
import TradingSessionPanel from "@/components/TradingSessionPanel";
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

  const [{ data: trades }, { data: session }] = await Promise.all([
    supabase.from("trading_journal").select("*").eq("user_id", user.id).order("trade_date", { ascending: false }),
    supabase.from("trading_sessions").select("*").eq("user_id", user.id).eq("session_date", today).maybeSingle(),
  ]);

  const todayTrades = (trades || []).filter((t) => t.trade_date === today);

  return (
    <div className="desk-shell lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">{strings.trading.journal}</h1>
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
