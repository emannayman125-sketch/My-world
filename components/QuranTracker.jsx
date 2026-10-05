"use client";

import { useState } from "react";
import { BookOpenCheck, Plus, Check, ChevronDown, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { todayISO } from "@/lib/time";
import { groupPortions, markMemorizedPatch, markReviewedPatch } from "@/lib/quranReview";

// Deliberately gentle, per the brief: no streaks, no "you missed a day",
// no red overdue flags. A late review is just today's review.
export default function QuranTracker({ userId, initialPortions, initialWeekly, strings: s }) {
  const supabase = createClient();
  const [portions, setPortions] = useState(initialPortions || []);
  const [form, setForm] = useState({ surah: "", from_ayah: "", to_ayah: "" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [showRange, setShowRange] = useState(false);
  const [addError, setAddError] = useState(false);
  const [actionError, setActionError] = useState(false);

  const { memorizing, dueToday, onTrack } = groupPortions(portions);

  async function addPortion(e) {
    e.preventDefault();
    if (!form.surah.trim()) return;
    setSaving(true);
    setAddError(false);
    const { data, error } = await supabase
      .from("quran_portions")
      .insert({
        user_id: userId,
        surah: form.surah.trim(),
        from_ayah: form.from_ayah ? Number(form.from_ayah) : null,
        to_ayah: form.to_ayah ? Number(form.to_ayah) : null,
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setPortions((list) => [data, ...list]);
      setForm({ surah: "", from_ayah: "", to_ayah: "" });
      setShowRange(false);
    } else {
      setAddError(true);
    }
  }

  async function markMemorized(portion) {
    setBusyId(portion.id);
    setActionError(false);
    const patch = markMemorizedPatch();
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("quran_portions").update(patch).eq("id", portion.id),
      supabase.from("quran_events").insert({ user_id: userId, portion_id: portion.id, kind: "memorized", event_date: todayISO() }),
    ]);
    setBusyId(null);
    if (e1 || e2) { setActionError(true); return; }
    setPortions((list) => list.map((p) => (p.id === portion.id ? { ...p, ...patch } : p)));
  }

  async function markReviewed(portion) {
    setBusyId(portion.id);
    setActionError(false);
    const patch = markReviewedPatch(portion);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("quran_portions").update(patch).eq("id", portion.id),
      supabase.from("quran_events").insert({ user_id: userId, portion_id: portion.id, kind: "reviewed", event_date: todayISO() }),
    ]);
    setBusyId(null);
    if (e1 || e2) { setActionError(true); return; }
    setPortions((list) => list.map((p) => (p.id === portion.id ? { ...p, ...patch } : p)));
  }

  const range = (p) => (p.from_ayah && p.to_ayah ? ` (${p.from_ayah}–${p.to_ayah})` : "");

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-display text-xl mb-4">{s.weeklyTitle}</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-display text-2xl">{initialWeekly.memorized}</p>
            <p className="text-xs text-ink-muted dark:text-moon-muted mt-1">{s.weeklyMemorized}</p>
          </div>
          <div>
            <p className="font-display text-2xl">{initialWeekly.reviewed}</p>
            <p className="text-xs text-ink-muted dark:text-moon-muted mt-1">{s.weeklyReviewed}</p>
          </div>
          <div>
            <p className="font-display text-2xl">{initialWeekly.studyDays}</p>
            <p className="text-xs text-ink-muted dark:text-moon-muted mt-1">{s.weeklyDays}</p>
          </div>
        </div>
      </div>

      <form onSubmit={addPortion} className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={form.surah}
            onChange={(e) => setForm({ ...form, surah: e.target.value })}
            placeholder={s.surahPlaceholder}
            className="flex-1 min-w-[160px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <button
            type="submit"
            disabled={saving || !form.surah.trim()}
            className="inline-flex items-center gap-1 rounded-soft bg-lantern text-lantern-ink text-sm font-medium px-4 py-2 shadow-lantern hover:brightness-105 transition disabled:opacity-50"
          >
            <Plus size={14} /> {saving ? s.adding : s.add}
          </button>
        </div>

        {!showRange ? (
          <button
            type="button"
            onClick={() => setShowRange(true)}
            className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon flex items-center gap-1"
          >
            <ChevronDown size={12} /> {s.specifyRange}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number" min="1"
              value={form.from_ayah}
              onChange={(e) => setForm({ ...form, from_ayah: e.target.value })}
              placeholder={s.fromAyah}
              className="w-24 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <span className="text-xs text-ink-muted dark:text-moon-muted">{s.to}</span>
            <input
              type="number" min="1"
              value={form.to_ayah}
              onChange={(e) => setForm({ ...form, to_ayah: e.target.value })}
              placeholder={s.toAyah}
              className="w-24 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
        )}

        {addError && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle size={13} /> {s.addError}
          </p>
        )}
      </form>

      {actionError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle size={13} /> {s.actionError}
        </p>
      )}

      {dueToday.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-sage dark:text-sage-soft">{s.dueToday}</p>
          {dueToday.map((p) => (
            <div key={p.id} className="card p-4 flex items-center justify-between gap-3">
              <span className="text-sm">{p.surah}{range(p)}</span>
              <button
                onClick={() => markReviewed(p)}
                disabled={busyId === p.id}
                className="inline-flex items-center gap-1 rounded-full bg-sage/15 text-sage dark:text-sage-soft text-xs px-3 py-1.5 hover:bg-sage/25 transition disabled:opacity-40"
              >
                <Check size={13} /> {s.markReviewed}
              </button>
            </div>
          ))}
        </section>
      )}

      {memorizing.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted">{s.stillMemorizing}</p>
          {memorizing.map((p) => (
            <div key={p.id} className="card p-4 flex items-center justify-between gap-3">
              <span className="text-sm">{p.surah}{range(p)}</span>
              <button
                onClick={() => markMemorized(p)}
                disabled={busyId === p.id}
                className="inline-flex items-center gap-1 rounded-full border border-dusk/30 text-dusk dark:text-dusk-soft text-xs px-3 py-1.5 hover:bg-dusk/10 transition disabled:opacity-40"
              >
                <BookOpenCheck size={13} /> {s.markMemorized}
              </button>
            </div>
          ))}
        </section>
      )}

      {onTrack.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted">{s.onTrack}</p>
          {onTrack.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-1 py-1.5 text-sm text-ink-muted dark:text-moon-muted">
              <span>{p.surah}{range(p)}</span>
              <span className="text-xs">{s.nextReview}: {p.next_review_date}</span>
            </div>
          ))}
        </section>
      )}

      {portions.length === 0 && (
        <p className="text-sm text-ink-muted dark:text-moon-muted text-center py-6">{s.empty}</p>
      )}
    </div>
  );
}
