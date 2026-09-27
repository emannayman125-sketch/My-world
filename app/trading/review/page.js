import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

function computeStats(trades) {
  const closed = trades.filter((tr) => tr.result === "win" || tr.result === "loss" || tr.result === "breakeven");
  const wins = closed.filter((tr) => tr.result === "win");
  const losses = closed.filter((tr) => tr.result === "loss");

  const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : null;
  const avgWin = wins.length ? wins.reduce((s, tr) => s + (tr.pnl || 0), 0) / wins.length : null;
  const avgLoss = losses.length ? losses.reduce((s, tr) => s + (tr.pnl || 0), 0) / losses.length : null;

  // best/worst symbol by total pnl
  const bySymbol = {};
  trades.forEach((tr) => {
    if (tr.pnl == null) return;
    bySymbol[tr.symbol] = (bySymbol[tr.symbol] || 0) + tr.pnl;
  });
  const symbolEntries = Object.entries(bySymbol);
  const best = symbolEntries.length ? symbolEntries.reduce((a, b) => (b[1] > a[1] ? b : a)) : null;
  const worst = symbolEntries.length ? symbolEntries.reduce((a, b) => (b[1] < a[1] ? b : a)) : null;

  // monthly performance
  const byMonth = {};
  trades.forEach((tr) => {
    if (tr.pnl == null || !tr.trade_date) return;
    const month = tr.trade_date.slice(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + tr.pnl;
  });
  const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));

  return { winRate, avgWin, avgLoss, best, worst, months, totalTrades: trades.length };
}

export default async function TradingReviewPage() {
  const locale = getLocale();
  const strings = t(locale);
  const tr = strings.trading;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trades } = await supabase
    .from("trading_journal")
    .select("*")
    .eq("user_id", user.id);

  const stats = computeStats(trades || []);
  const maxAbs = Math.max(1, ...stats.months.map(([, v]) => Math.abs(v)));

  return (
    <div className="desk-shell lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">{tr.review}</h1>

        {stats.totalTrades === 0 ? (
          <p className="text-sm desk-muted">{tr.noReviewData}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label={tr.totalTrades} value={stats.totalTrades} />
              <StatCard label={tr.winRate} value={stats.winRate != null ? `${stats.winRate}%` : "—"} />
              <StatCard label={tr.avgWin} value={stats.avgWin != null ? `$${stats.avgWin.toFixed(0)}` : "—"} positive />
              <StatCard label={tr.avgLoss} value={stats.avgLoss != null ? `$${stats.avgLoss.toFixed(0)}` : "—"} negative />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <StatCard label={tr.bestSymbol} value={stats.best ? `${stats.best[0]} (+$${stats.best[1].toFixed(0)})` : "—"} />
              <StatCard label={tr.worstSymbol} value={stats.worst ? `${stats.worst[0]} ($${stats.worst[1].toFixed(0)})` : "—"} />
            </div>

            {stats.months.length > 0 && (
              <div className="desk-card p-6">
                <h2 className="font-display text-xl mb-4">{tr.monthlyPerformance}</h2>
                <div className="space-y-2">
                  {stats.months.map(([month, value]) => (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-xs desk-muted w-16 shrink-0">{month}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${value >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                          style={{ width: `${(Math.abs(value) / maxAbs) * 100}%` }}
                        />
                      </div>
                      <span className={`desk-mono text-xs w-20 text-end shrink-0 ${value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {value >= 0 ? "+" : ""}${value.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, positive, negative }) {
  return (
    <div className="desk-card p-4">
      <p className="text-xs desk-muted mb-1">{label}</p>
      <p className={`desk-mono text-2xl font-semibold ${positive ? "text-emerald-400" : negative ? "text-red-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}
