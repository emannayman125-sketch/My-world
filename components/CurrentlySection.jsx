"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import PrivacyToggle from "./PrivacyToggle";

const KIND_EMOJI = { listening: "🎧", watching: "🎬", reading: "📚" };
const KIND_KEYS = Object.keys(KIND_EMOJI);

export default function CurrentlySection({ userId, initialItems, strings }) {
  const tr = strings.dashboard.currently;
  const supabase = createClient();
  const [items, setItems] = useState(initialItems || []);
  const [form, setForm] = useState({ kind: "listening", title: "", subtitle: "", is_public: false });

  async function addItem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    // Replace the existing item of the same kind — only one "currently" per category
    const existing = items.find((i) => i.kind === form.kind);
    if (existing) {
      await supabase.from("currently_items").delete().eq("id", existing.id);
    }

    const { data, error } = await supabase
      .from("currently_items")
      .insert({
        user_id: userId,
        kind: form.kind,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        is_public: form.is_public,
      })
      .select()
      .single();

    if (!error && data) {
      setItems((list) => [...list.filter((i) => i.kind !== form.kind), data]);
      setForm({ kind: form.kind, title: "", subtitle: "", is_public: false });
    }
  }

  async function togglePublic(item) {
    const next = !item.is_public;
    await supabase.from("currently_items").update({ is_public: next }).eq("id", item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_public: next } : i)));
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl mb-4">{tr.heading}</h2>

      <div className="grid gap-3 mb-4">
        {KIND_KEYS.map((kind) => {
          const item = items.find((i) => i.kind === kind);
          return (
            <div key={kind} className="flex items-center gap-3 text-sm flex-wrap">
              <span className="w-24 text-ink-muted dark:text-moon-muted">
                {KIND_EMOJI[kind]} {tr.kinds[kind]}
              </span>
              <span className="flex items-center gap-2">
                {item ? (
                  <>
                    {item.title}
                    {item.subtitle && (
                      <span className="text-ink-muted dark:text-moon-muted"> — {item.subtitle}</span>
                    )}
                    <PrivacyToggle isPublic={item.is_public} onToggle={() => togglePublic(item)} />
                  </>
                ) : (
                  <span className="text-ink-muted dark:text-moon-muted">{tr.none}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={addItem} className="flex flex-wrap gap-2">
        <select
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value })}
          className="rounded-soft border border-black/10 dark:border-white/10
                     bg-transparent px-2 py-2 text-sm outline-none focus:border-lantern"
        >
          {KIND_KEYS.map((kind) => (
            <option key={kind} value={kind}>{tr.kinds[kind]}</option>
          ))}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={tr.titlePlaceholder}
          className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10
                     bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <input
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          placeholder={tr.subtitlePlaceholder}
          className="flex-1 min-w-[100px] rounded-soft border border-black/10 dark:border-white/10
                     bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <button
          type="submit"
          className="rounded-soft bg-dusk text-white text-sm px-4 py-2 hover:brightness-105"
        >
          {tr.update}
        </button>
      </form>
      <label className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-moon-muted mt-2">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
        />
        {tr.showOnPublic}
      </label>
    </div>
  );
}
