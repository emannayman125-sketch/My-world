"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { AlertTriangle, CheckCircle2, Settings2 } from "lucide-react";
import { todayISO } from "@/lib/time";
import { evaluateSession } from "@/lib/tradingSession";

const LEVEL_STYLE = {
  ok: "border-emerald-500/25 bg-emerald-500/[0.06]",
  warning: "border-amber-500/30 bg-amber-500/[0.08]",
  breached: "border-red-500/30 bg-red-500/[0.08]",
};

// A quiet self-imposed guardrail for scalping days: he sets the limits, the
// panel only ever nudges — it never blocks logging another trade.
export default function TradingSessionPanel({ userId, initialSession, todayTrades, strings: tr }) {
  const supabase = createClient();
  const [session, setSession] = useState(initialSession);
  const [editing, setEditing] = useState(!initialSession);
  const [form, setForm] = useState({
    max_loss: initialSession?.max_loss ?? "",
    max_trades: initialSession?.max_trades ?? "",
    max_consecutive_losses: initialSession?.max_consecutive_losses ?? "",
  });
  const [saving, setSaving] = useState(false);

  const limits = session
    ? { max_loss: session.max_loss, max_trades: session.max_trades, max_consecutive_losses: session.max_consecutive_losses }
    : {};
  const s = evaluateSession(todayTrades, limits);
  const anyLimitSet = s.loss.set || s.trades.set || s.streak.set;

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      user_id: userId,
      session_date: todayISO(),
      max_loss: form.max_loss === "" ? null : Number(form.max_loss),
      max_trades: form.max_trades === "" ? null : Number(form.max_trades),
      max_consecutive_losses: form.max_consecutive_losses === "" ? null : Number(form.max_consecutive_losses),
    };
    const { data, error } = await supabase
      .from("trading_sessions")
      .upsert(payload, { onConflict: "user_id,session_date" })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setSession(data);
      setEditing(false);
    }
  }

  const Gauge = ({ label, g, valueLabel }) =>
    g.set ? (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-muted dark:text-moon-muted">{label}</span>
          <span className={g.breached ? "text-red-400" : g.ratio >= 0.8 ? "text-amber-400" : "text-ink-muted dark:text-moon-muted"}>
            {valueLabel}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full ${g.breached ? "bg-red-500" : g.ratio >= 0.8 ? "bg-amber-400" : "bg-emerald-500"}`}
            style={{ width: `${Math.round(g.ratio * 100)}%` }}
          />
        </div>
      </div>
    ) : null;

  if (editing) {
    return (
      <form onSubmit={save} className="card p-4 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Settings2 size={15} /> {tr.sessionTitle}
        </p>
        <p className="text-xs text-ink-muted dark:text-moon-muted">{tr.sessionHint}</p>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number" min="0" step="any"
            value={form.max_loss}
            onChange={(e) => setForm({ ...form, max_loss: e.target.value })}
            placeholder={tr.maxLossPlaceholder}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            type="number" min="1" step="1"
            value={form.max_trades}
            onChange={(e) => setForm({ ...form, max_trades: e.target.value })}
            placeholder={tr.maxTradesPlaceholder}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            type="number" min="1" step="1"
            value={form.max_consecutive_losses}
            onChange={(e) => setForm({ ...form, max_consecutive_losses: e.target.value })}
            placeholder={tr.maxStreakPlaceholder}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-soft bg-sage text-white text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50">
            {saving ? tr.saving : tr.startSession}
          </button>
          {session && (
            <button type="button" onClick={() => setEditing(false)} className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
              {tr.cancel}
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className={`card p-4 space-y-3 border ${LEVEL_STYLE[s.level]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          {s.level === "breached" ? (
            <AlertTriangle size={15} className="text-red-400" />
          ) : s.level === "warning" ? (
            <AlertTriangle size={15} className="text-amber-400" />
          ) : (
            <CheckCircle2 size={15} className="text-emerald-500" />
          )}
          {tr.sessionTitle}
        </p>
        <button onClick={() => setEditing(true)} className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon flex items-center gap-1">
          <Settings2 size={13} /> {tr.editLimits}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-ink-muted dark:text-moon-muted">{tr.netToday}</span>
        <span className={s.net < 0 ? "text-red-400" : "text-emerald-400"}>${s.net.toFixed(2)}</span>
        <span className="text-ink-muted dark:text-moon-muted">{tr.tradesToday}</span>
        <span>{s.tradeCount}</span>
        {s.lossStreak > 0 && (
          <>
            <span className="text-ink-muted dark:text-moon-muted">{tr.lossStreak}</span>
            <span>{s.lossStreak}</span>
          </>
        )}
      </div>

      {anyLimitSet && (
        <div className="space-y-2 pt-1">
          <Gauge label={tr.maxLossPlaceholder} g={s.loss} valueLabel={`$${Math.max(0, -s.net).toFixed(0)} / ${session.max_loss}`} />
          <Gauge label={tr.maxTradesPlaceholder} g={s.trades} valueLabel={`${s.tradeCount} / ${session.max_trades}`} />
          <Gauge label={tr.maxStreakPlaceholder} g={s.streak} valueLabel={`${s.lossStreak} / ${session.max_consecutive_losses}`} />
        </div>
      )}

      {s.level === "breached" && <p className="text-xs text-red-400">{tr.breachedNote}</p>}
      {s.level === "warning" && <p className="text-xs text-amber-400">{tr.warningNote}</p>}
      {!anyLimitSet && <p className="text-xs text-ink-muted dark:text-moon-muted">{tr.noLimitsNote}</p>}
    </div>
  );
}
