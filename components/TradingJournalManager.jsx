"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { Plus, Trash2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { todayISO } from "@/lib/time";

const RESULT_COLOR = {
  open: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  win: "bg-emerald-500/15 text-emerald-400",
  loss: "bg-red-500/15 text-red-500",
  breakeven: "bg-dusk/20 text-dusk",
};

const EMPTY_FORM = {
  symbol: "", trade_date: "", entry_price: "", exit_price: "", position_size: "",
  stop_loss: "", target: "", strategy: "", reason_entry: "", result: "open",
  pnl: "", fees: "", direction: "", emotional_state: "", lessons_learned: "",
};

const EMPTY_QUICK = { symbol: "", direction: "long", result: "win", pnl: "", fees: "" };

export default function TradingJournalManager({ userId, initialTrades, strings, viewerId, readOnly = false }) {
  const loggerId = viewerId || userId; // who is actually logging this trade
  const supabase = createClient();
  const { confirm } = useConfirm();
  const tr = strings.trading;

  const [trades, setTrades] = useState(initialTrades || []);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [quick, setQuick] = useState(EMPTY_QUICK);
  const [quickOpen, setQuickOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function num(v) {
    return v === "" || v === null || v === undefined ? null : Number(v);
  }

  async function addTrade(e) {
    e.preventDefault();
    if (!form.symbol.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("trading_journal")
      .insert({
        user_id: userId,
        logged_by: loggerId !== userId ? loggerId : null,
        symbol: form.symbol.trim().toUpperCase(),
        trade_date: form.trade_date || null,
        entry_price: num(form.entry_price),
        exit_price: num(form.exit_price),
        position_size: num(form.position_size),
        stop_loss: num(form.stop_loss),
        target: num(form.target),
        strategy: form.strategy.trim() || null,
        reason_entry: form.reason_entry.trim() || null,
        result: form.result,
        direction: form.direction || null,
        pnl: num(form.pnl),
        fees: num(form.fees) || 0,
        emotional_state: form.emotional_state.trim() || null,
        lessons_learned: form.lessons_learned.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setTrades((list) => [data, ...list]);
      setForm(EMPTY_FORM);
      setOpen(false);
    }
  }

  // The 3-tap path for scalping: symbol, direction, result — everything else
  // stays reviewable later from the full form if he wants more detail.
  async function addQuick(e) {
    e.preventDefault();
    if (!quick.symbol.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("trading_journal")
      .insert({
        user_id: userId,
        logged_by: loggerId !== userId ? loggerId : null,
        symbol: quick.symbol.trim().toUpperCase(),
        trade_date: todayISO(),
        direction: quick.direction,
        result: quick.result,
        pnl: num(quick.pnl),
        fees: num(quick.fees) || 0,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setTrades((list) => [data, ...list]);
      setQuick({ ...EMPTY_QUICK, direction: quick.direction }); // keep last direction, it rarely flips mid-session
    }
  }

  async function removeTrade(id) {
    if (!(await confirm(tr.confirmDeleteTrade))) return;
    await supabase.from("trading_journal").delete().eq("id", id);
    setTrades((list) => list.filter((t) => t.id !== id));
  }

  const sorted = [...trades].sort((a, b) => new Date(b.trade_date || b.created_at) - new Date(a.trade_date || a.created_at));

  return (
    <div className="space-y-3">
      {readOnly && (
        <p className="text-xs text-ink-muted dark:text-moon-muted">{tr.sharing.statusView}</p>
      )}
      {!readOnly && !quickOpen ? (
        <button
          onClick={() => setQuickOpen(true)}
          className="w-full card p-3 flex items-center justify-center gap-2 text-sm text-sage dark:text-sage-soft hover:text-sage transition"
        >
          <Zap size={14} strokeWidth={2} />
          {tr.quickLog}
        </button>
      ) : !readOnly ? (
        <form onSubmit={addQuick} className="card p-3 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={quick.symbol}
            onChange={(e) => setQuick({ ...quick, symbol: e.target.value })}
            placeholder={tr.symbol}
            className="w-24 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage uppercase"
          />
          <div className="flex rounded-soft border border-black/10 dark:border-white/10 overflow-hidden text-xs">
            {["long", "short"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setQuick({ ...quick, direction: d })}
                className={`px-3 py-2 transition ${quick.direction === d ? "bg-sage text-white" : "text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"}`}
              >
                {tr.direction[d]}
              </button>
            ))}
          </div>
          <select
            value={quick.result}
            onChange={(e) => setQuick({ ...quick, result: e.target.value })}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          >
            {Object.entries(tr.resultOptions).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <input
            type="number" step="0.01"
            value={quick.pnl}
            onChange={(e) => setQuick({ ...quick, pnl: e.target.value })}
            placeholder={tr.pnl}
            className="w-24 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            type="number" step="0.01"
            value={quick.fees}
            onChange={(e) => setQuick({ ...quick, fees: e.target.value })}
            placeholder={tr.fees}
            className="w-20 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <button
            type="submit"
            disabled={saving || !quick.symbol.trim()}
            className="rounded-soft bg-sage text-white text-sm font-medium px-4 py-2 hover:brightness-110 transition disabled:opacity-50"
          >
            {tr.log}
          </button>
          <button type="button" onClick={() => setQuickOpen(false)} className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
            {strings.quote.cancel}
          </button>
        </form>
      ) : null}

      {!readOnly && !open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm
                     text-ink-muted dark:text-moon-muted hover:text-sage dark:hover:text-sage-soft transition"
        >
          <Plus size={15} strokeWidth={2} />
          {tr.addTrade}
        </button>
      ) : !readOnly ? (
        <form onSubmit={addTrade} className="card p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder={tr.symbol} autoFocus
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage uppercase" />
            <input type="date" value={form.trade_date} onChange={(e) => setForm({ ...form, trade_date: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
              placeholder={tr.entryPrice}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
              placeholder={tr.exitPrice}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.position_size} onChange={(e) => setForm({ ...form, position_size: e.target.value })}
              placeholder={tr.positionSize}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })}
              placeholder={tr.pnl}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })}
              placeholder={tr.fees}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
              placeholder={tr.stopLoss}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
            <input type="number" step="0.01" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
              placeholder={tr.target}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
          </div>
          <input value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}
            placeholder={tr.strategy}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
          <textarea value={form.reason_entry} onChange={(e) => setForm({ ...form, reason_entry: e.target.value })}
            placeholder={tr.reasonEntry} rows={2}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage resize-none" />
          <div className="flex gap-2 flex-wrap">
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage">
              {Object.entries(tr.resultOptions).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage">
              <option value="">{tr.direction.unset}</option>
              <option value="long">{tr.direction.long}</option>
              <option value="short">{tr.direction.short}</option>
            </select>
            <input value={form.emotional_state} onChange={(e) => setForm({ ...form, emotional_state: e.target.value })}
              placeholder={tr.emotionalState}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage" />
          </div>
          <textarea value={form.lessons_learned} onChange={(e) => setForm({ ...form, lessons_learned: e.target.value })}
            placeholder={tr.lessonsLearned} rows={2}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage resize-none" />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.symbol.trim()}
              className="rounded-soft bg-sage text-white text-sm font-medium px-4 py-2 hover:brightness-110 transition disabled:opacity-50">
              {saving ? tr.saving : tr.save}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {sorted.length === 0 && !open && (
        <p className="text-sm text-ink-muted dark:text-moon-muted text-center py-6">{tr.noTrades}</p>
      )}

      <div className="space-y-2">
        {sorted.map((t) => (
          <div key={t.id} className="card overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <span className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium ${RESULT_COLOR[t.result] || RESULT_COLOR.open}`}>
                {tr.resultOptions[t.result] || tr.resultOptions.open}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {t.symbol} {t.direction && <span className="text-xs text-ink-muted dark:text-moon-muted">· {tr.direction[t.direction]}</span>}
                </p>
                <p className="text-xs text-ink-muted dark:text-moon-muted">
                  {t.trade_date}
                  {t.pnl != null && (() => {
                    const net = Number(t.pnl) - Number(t.fees || 0);
                    return ` · ${net >= 0 ? "+" : ""}$${net.toFixed(2)}${t.fees ? ` ${tr.netSuffix}` : ""}`;
                  })()}
                </p>
              </div>
              <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon transition shrink-0">
                {expanded === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {loggerId === userId && (
                <button onClick={() => removeTrade(t.id)} aria-label={tr.delete} className="text-ink-muted/50 dark:text-moon-muted/40 hover:text-red-500 transition shrink-0">
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              )}
            </div>
            {expanded === t.id && (
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 space-y-1.5 text-sm bg-black/[0.015] dark:bg-white/[0.02]">
                {t.entry_price != null && <p>{tr.entryPrice}: {t.entry_price}</p>}
                {t.exit_price != null && <p>{tr.exitPrice}: {t.exit_price}</p>}
                {t.position_size != null && <p>{tr.positionSize}: {t.position_size}</p>}
                {t.stop_loss != null && <p>{tr.stopLoss}: {t.stop_loss}</p>}
                {t.target != null && <p>{tr.target}: {t.target}</p>}
                {!!t.fees && <p>{tr.fees}: {t.fees}</p>}
                {t.strategy && <p>{tr.strategy}: {t.strategy}</p>}
                {t.reason_entry && <p>{tr.reasonEntry}: {t.reason_entry}</p>}
                {t.emotional_state && <p>{tr.emotionalState}: {t.emotional_state}</p>}
                {t.lessons_learned && <p className="text-ink-muted dark:text-moon-muted">{tr.lessonsLearned}: {t.lessons_learned}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
