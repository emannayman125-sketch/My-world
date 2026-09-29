"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { Hourglass, Lock, Unlock, Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";
import { todayISO } from "@/lib/time";

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function TimeCapsuleManager({ userId, initialCapsules, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const tc = strings.timeCapsule;
  const [capsules, setCapsules] = useState(initialCapsules || []);
  const [message, setMessage] = useState("");
  const [option, setOption] = useState("1month");
  const [customDate, setCustomDate] = useState("");
  const [saving, setSaving] = useState(false);

  const today = todayISO();

  async function seal(e) {
    e.preventDefault();
    if (!message.trim()) return;

    let revealDate;
    if (option === "1month") revealDate = addMonths(today, 1);
    else if (option === "6months") revealDate = addMonths(today, 6);
    else if (option === "1year") revealDate = addMonths(today, 12);
    else revealDate = customDate;

    if (!revealDate) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("time_capsules")
      .insert({ user_id: userId, message: message.trim(), reveal_date: revealDate })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setCapsules((list) => [data, ...list]);
      setMessage("");
      setCustomDate("");
    }
  }

  async function remove(id) {
    if (!(await confirm(tc.confirmDelete))) return;
    await supabase.from("time_capsules").delete().eq("id", id);
    setCapsules((list) => list.filter((c) => c.id !== id));
  }

  const pending = capsules.filter((c) => c.reveal_date > today);
  const revealed = capsules.filter((c) => c.reveal_date <= today);

  return (
    <div className="space-y-6">
      <form onSubmit={seal} className="card p-4 space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={tc.placeholder}
          rows={4}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                     px-4 py-3 text-sm outline-none focus:border-sage resize-none"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{tc.revealIn}</label>
          <select
            value={option}
            onChange={(e) => setOption(e.target.value)}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          >
            {Object.entries(tc.options).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          {option === "custom" && (
            <input
              type="date"
              min={today}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          )}
        </div>
        <button
          type="submit"
          disabled={saving || !message.trim() || (option === "custom" && !customDate)}
          className="rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50"
        >
          {saving ? tc.sealing : tc.seal}
        </button>
      </form>

      {capsules.length === 0 && (
        <EmptyState icon={Hourglass} title={tc.noCapsules} />
      )}

      {revealed.length > 0 && (
        <div>
          <h2 className="text-xs text-ink-muted dark:text-moon-muted mb-2">{tc.revealed}</h2>
          <div className="space-y-2">
            {revealed.map((c) => (
              <div key={c.id} className="card p-4 flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
                  <Unlock size={15} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-7">{c.message}</p>
                  <p className="text-xs text-ink-muted dark:text-moon-muted mt-1">{tc.opened}: {c.reveal_date}</p>
                </div>
                <button onClick={() => remove(c.id)} aria-label={tc.delete} className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-xs text-ink-muted dark:text-moon-muted mb-2">{tc.pending}</h2>
          <div className="space-y-2">
            {pending.map((c) => (
              <div key={c.id} className="card p-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted shrink-0">
                  <Lock size={15} strokeWidth={2} />
                </span>
                <p className="flex-1 text-sm text-ink-muted dark:text-moon-muted">
                  {tc.locked} {c.reveal_date}
                </p>
                <button onClick={() => remove(c.id)} aria-label={tc.delete} className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
