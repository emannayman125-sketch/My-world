"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { CheckCircle2, XCircle } from "lucide-react";
import { todayISO } from "@/lib/time";

const FEELINGS = ["focused", "calm", "stressed", "impulsive", "tired"];

// The main entry point for Trading now: a 60-second reflection after the
// real session (on his actual platform) is over. Replaces live per-trade
// logging as the star of the page — this is what he'll actually use.
export default function TradingDayReflection({ userId, initialToday, recentNotes, strings: s }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    net_pnl: initialToday?.net_pnl ?? "",
    trade_count: initialToday?.trade_count ?? "",
    feeling: initialToday?.feeling || "",
    lesson: initialToday?.lesson || "",
    followed_rules: initialToday?.followed_rules,
  });
  const [saved, setSaved] = useState(!!initialToday);
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      user_id: userId,
      note_date: todayISO(),
      net_pnl: form.net_pnl === "" ? null : Number(form.net_pnl),
      trade_count: form.trade_count === "" ? null : Number(form.trade_count),
      feeling: form.feeling || null,
      lesson: form.lesson.trim() || null,
      followed_rules: form.followed_rules ?? null,
    };
    const { error } = await supabase.from("trading_day_notes").upsert(payload, { onConflict: "user_id,note_date" });
    setSaving(false);
    if (!error) setSaved(true);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="card p-5 space-y-4">
        <div>
          <p className="text-sm font-medium">{s.title}</p>
          <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{s.hint}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink-muted dark:text-moon-muted">{s.netPnl}</label>
            <input
              type="number" step="0.01"
              value={form.net_pnl}
              onChange={(e) => { setForm({ ...form, net_pnl: e.target.value }); setSaved(false); }}
              className="w-full mt-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted dark:text-moon-muted">{s.tradeCount}</label>
            <input
              type="number" min="0"
              value={form.trade_count}
              onChange={(e) => { setForm({ ...form, trade_count: e.target.value }); setSaved(false); }}
              className="w-full mt-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-ink-muted dark:text-moon-muted block mb-1.5">{s.feeling}</label>
          <div className="flex flex-wrap gap-1.5">
            {FEELINGS.map((f) => (
              <button
                key={f} type="button"
                onClick={() => { setForm({ ...form, feeling: f }); setSaved(false); }}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  form.feeling === f ? "bg-sage text-white" : "border border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
                }`}
              >
                {s.feelings[f]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-ink-muted dark:text-moon-muted block mb-1.5">{s.followedRules}</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setForm({ ...form, followed_rules: true }); setSaved(false); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                form.followed_rules === true ? "bg-emerald-500/20 text-emerald-400" : "border border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted"
              }`}>
              <CheckCircle2 size={13} /> {s.yes}
            </button>
            <button type="button" onClick={() => { setForm({ ...form, followed_rules: false }); setSaved(false); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
                form.followed_rules === false ? "bg-red-500/15 text-red-400" : "border border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted"
              }`}>
              <XCircle size={13} /> {s.no}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-ink-muted dark:text-moon-muted">{s.lesson}</label>
          <textarea
            rows={2}
            value={form.lesson}
            onChange={(e) => { setForm({ ...form, lesson: e.target.value }); setSaved(false); }}
            placeholder={s.lessonPlaceholder}
            className="w-full mt-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-soft bg-sage text-white text-sm font-medium px-5 py-2.5 hover:brightness-110 transition disabled:opacity-50"
        >
          {saved ? s.saved : saving ? s.saving : s.save}
        </button>
      </form>

      {recentNotes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted">{s.recentTitle}</p>
          {recentNotes.map((n) => (
            <div key={n.note_date} className="flex items-center justify-between text-sm px-1">
              <span className="text-ink-muted dark:text-moon-muted">{n.note_date}</span>
              <span className="flex items-center gap-2">
                {n.feeling && <span className="text-xs">{s.feelings[n.feeling]}</span>}
                {n.net_pnl != null && (
                  <span className={n.net_pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {n.net_pnl >= 0 ? "+" : ""}${n.net_pnl}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
