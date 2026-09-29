// Pure functions for the scalping "session mode": how close is today to the
// limits he set for himself? No enforcement here — the UI only nudges.

/** Net P&L for a list of trades, after fees. Open trades contribute nothing yet. */
export function netPnl(trades) {
  return trades.reduce((sum, t) => sum + (Number(t.pnl) || 0) - (Number(t.fees) || 0), 0);
}

/** Consecutive losses counting back from the most recent trade. Breakeven resets it too. */
export function consecutiveLosses(trades) {
  const closed = trades
    .filter((t) => t.result === "win" || t.result === "loss" || t.result === "breakeven")
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  let streak = 0;
  for (const t of closed) {
    if (t.result === "loss") streak++;
    else break;
  }
  return streak;
}

/**
 * @param {object[]} todayTrades
 * @param {{max_loss?: number, max_trades?: number, max_consecutive_losses?: number}} limits
 * @returns {{
 *   net: number, tradeCount: number, lossStreak: number,
 *   loss: {set:boolean, ratio:number, breached:boolean},
 *   trades: {set:boolean, ratio:number, breached:boolean},
 *   streak: {set:boolean, ratio:number, breached:boolean},
 *   level: "ok"|"warning"|"breached"
 * }}
 */
export function evaluateSession(todayTrades, limits = {}) {
  const net = netPnl(todayTrades);
  const tradeCount = todayTrades.length;
  const lossStreak = consecutiveLosses(todayTrades);

  const gauge = (value, max, breachTest) => {
    if (max === null || max === undefined || max === "") return { set: false, ratio: 0, breached: false };
    const m = Number(max);
    if (!(m > 0)) return { set: false, ratio: 0, breached: false };
    return { set: true, ratio: Math.min(1, value / m), breached: breachTest(value, m) };
  };

  // A loss limit is a magnitude (e.g. "don't lose more than $100"); net going
  // more negative than that magnitude is a breach.
  const loss = gauge(Math.max(0, -net), limits.max_loss, (v, m) => v >= m);
  const tradesG = gauge(tradeCount, limits.max_trades, (v, m) => v >= m);
  const streak = gauge(lossStreak, limits.max_consecutive_losses, (v, m) => v >= m);

  const anyBreached = loss.breached || tradesG.breached || streak.breached;
  const anyWarning = [loss, tradesG, streak].some((g) => g.set && !g.breached && g.ratio >= 0.8);
  const level = anyBreached ? "breached" : anyWarning ? "warning" : "ok";

  return { net, tradeCount, lossStreak, loss, trades: tradesG, streak, level };
}
