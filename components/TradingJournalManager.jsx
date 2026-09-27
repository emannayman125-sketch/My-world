"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const RESULT_COLOR = {
  open: "bg-white/5 desk-muted",
  win: "bg-emerald-500/15 text-emerald-400",
  loss: "bg-red-500/15 text-red-500",
  breakeven: "bg-dusk/20 text-dusk",
};

const EMPTY_FORM = {
  symbol: "", trade_date: "", entry_price: "", exit_price: "", position_size: "",
  stop_loss: "", target: "", strategy: "", reason_entry: "", result: "open",
  pnl: "", emotional_state: "", lessons_learned: "",
};

export default function TradingJournalManager({ userId, initialTrades, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const tr = strings.trading;

  const [trades, setTrades] = useState(initialTrades || []);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
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
        pnl: num(form.pnl),
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

  async function removeTrade(id) {
    if (!(await confirm(tr.confirmDeleteTrade))) return;
    await supabase.from("trading_journal").delete().eq("id", id);
    setTrades((list) => list.filter((t) => t.id !== id));
  }

  const sorted = [...trades].sort((a, b) => new Date(b.trade_date || b.created_at) - new Date(a.trade_date || a.created_at));

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm
                     desk-muted hover:text-sky-400 transition"
        >
          <Plus size={15} strokeWidth={2} />
          {tr.addTrade}
        </button>
      ) : (
        <form onSubmit={addTrade} className="desk-card p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder={tr.symbol} autoFocus
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500 uppercase" />
            <input type="date" value={form.trade_date} onChange={(e) => setForm({ ...form, trade_date: e.target.value })}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input type="number" step="0.01" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
              placeholder={tr.entryPrice}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input type="number" step="0.01" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
              placeholder={tr.exitPrice}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input type="number" step="0.01" value={form.position_size} onChange={(e) => setForm({ ...form, position_size: e.target.value })}
              placeholder={tr.positionSize}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input type="number" step="0.01" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })}
              placeholder={tr.pnl}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input type="number" step="0.01" value={form.stop_loss} onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
              placeholder={tr.stopLoss}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input type="number" step="0.01" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
              placeholder={tr.target}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
          <input value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}
            placeholder={tr.strategy}
            className="w-full rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          <textarea value={form.reason_entry} onChange={(e) => setForm({ ...form, reason_entry: e.target.value })}
            placeholder={tr.reasonEntry} rows={2}
            className="w-full rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none" />
          <div className="flex gap-2 flex-wrap">
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}
              className="rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500">
              {Object.entries(tr.resultOptions).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <input value={form.emotional_state} onChange={(e) => setForm({ ...form, emotional_state: e.target.value })}
              placeholder={tr.emotionalState}
              className="flex-1 min-w-[140px] rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
          <textarea value={form.lessons_learned} onChange={(e) => setForm({ ...form, lessons_learned: e.target.value })}
            placeholder={tr.lessonsLearned} rows={2}
            className="w-full rounded-soft border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none" />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.symbol.trim()}
              className="rounded-soft bg-sky-600 text-white text-sm font-medium px-4 py-2 hover:brightness-110 transition disabled:opacity-50">
              {saving ? tr.saving : tr.save}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-sm desk-muted hover:text-white">
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !open && (
        <p className="text-sm desk-muted text-center py-6">{tr.noTrades}</p>
      )}

      <div className="space-y-2">
        {sorted.map((t) => (
          <div key={t.id} className="desk-card overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <span className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium ${RESULT_COLOR[t.result] || RESULT_COLOR.open}`}>
                {tr.resultOptions[t.result] || tr.resultOptions.open}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.symbol}</p>
                <p className="text-xs desk-muted">
                  {t.trade_date} {t.pnl != null && `· ${t.pnl >= 0 ? "+" : ""}$${t.pnl}`}
                </p>
              </div>
              <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="desk-muted hover:text-white transition shrink-0">
                {expanded === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => removeTrade(t.id)} aria-label={tr.delete} className="text-white/30 hover:text-red-500 transition shrink-0">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
            {expanded === t.id && (
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 space-y-1.5 text-sm bg-black/[0.015] dark:bg-white/[0.02]">
                {t.entry_price != null && <p>{tr.entryPrice}: {t.entry_price}</p>}
                {t.exit_price != null && <p>{tr.exitPrice}: {t.exit_price}</p>}
                {t.position_size != null && <p>{tr.positionSize}: {t.position_size}</p>}
                {t.stop_loss != null && <p>{tr.stopLoss}: {t.stop_loss}</p>}
                {t.target != null && <p>{tr.target}: {t.target}</p>}
                {t.strategy && <p>{tr.strategy}: {t.strategy}</p>}
                {t.reason_entry && <p>{tr.reasonEntry}: {t.reason_entry}</p>}
                {t.emotional_state && <p>{tr.emotionalState}: {t.emotional_state}</p>}
                {t.lessons_learned && <p className="desk-muted">{tr.lessonsLearned}: {t.lessons_learned}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
