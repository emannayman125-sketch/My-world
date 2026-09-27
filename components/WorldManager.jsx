"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import PrivacyToggle from "./PrivacyToggle";
import LinkField from "./LinkField";

const KIND_META = {
  music: { emoji: "🎵", statusKeys: ["favorite"] },
  movie: { emoji: "🎬", statusKeys: ["watchlist", "finished"] },
  podcast: { emoji: "🎙️", statusKeys: ["favorite"] },
  book: { emoji: "📚", statusKeys: ["want_to_read", "finished"] },
  place: { emoji: "✈️", statusKeys: ["want_to_visit", "visited"] },
  hobby: { emoji: "🎮", statusKeys: ["favorite"] },
};
const KIND_KEYS = Object.keys(KIND_META);

export default function WorldManager({ userId, initialItems, strings }) {
  const tr = strings.legacy.world;
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [items, setItems] = useState(initialItems || []);
  const [activeKind, setActiveKind] = useState(KIND_KEYS[0]);
  const [form, setForm] = useState({ title: "", subtitle: "", status: KIND_META[KIND_KEYS[0]].statusKeys[0], link_url: "", is_public: false });

  const currentMeta = KIND_META[activeKind];

  async function addItem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const { data, error } = await supabase
      .from("world_items")
      .insert({
        user_id: userId,
        kind: activeKind,
        status: form.status,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        link_url: form.link_url.trim() || null,
        is_public: form.is_public,
      })
      .select()
      .single();

    if (!error && data) {
      setItems((list) => [data, ...list]);
      setForm({ title: "", subtitle: "", status: currentMeta.statusKeys[0], link_url: "", is_public: false });
    }
  }

  async function togglePublic(item) {
    const next = !item.is_public;
    await supabase.from("world_items").update({ is_public: next }).eq("id", item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_public: next } : i)));
  }

  async function removeItem(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("world_items").delete().eq("id", id);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  const kindItems = items.filter((i) => i.kind === activeKind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {KIND_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => {
              setActiveKind(k);
              setForm({ title: "", subtitle: "", status: KIND_META[k].statusKeys[0], link_url: "", is_public: false });
            }}
            className={`rounded-full px-4 py-2 text-sm transition
              ${activeKind === k
                ? "bg-lantern text-night"
                : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"}`}
          >
            {KIND_META[k].emoji} {tr.kinds[k].label}
          </button>
        ))}
      </div>

      <form onSubmit={addItem} className="card p-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-2 py-2 text-sm outline-none focus:border-lantern"
          >
            {currentMeta.statusKeys.map((sk) => (
              <option key={sk} value={sk}>{tr.kinds[activeKind].statuses[sk]}</option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={tr.title}
            className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
          />
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder={tr.subtitle}
            className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
          />
          <button
            type="submit"
            className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105"
          >
            {tr.add}
          </button>
        </div>
        <input
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          placeholder={tr.linkPlaceholder}
          className="w-full rounded-soft border border-black/10 dark:border-white/10
                     bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <label className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-moon-muted">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
          />
          {tr.showOnPublic}
        </label>
      </form>

      <div className="card p-4">
        {kindItems.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noItems}</p>
        )}
        <ul className="space-y-2">
          {kindItems.map((item) => {
            const statusLabel = tr.kinds[activeKind].statuses[item.status];
            return (
              <li
                key={item.id}
                className="rounded-soft px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{item.title}</span>
                    {item.subtitle && (
                      <span className="text-ink-muted dark:text-moon-muted"> — {item.subtitle}</span>
                    )}
                    {statusLabel && (
                      <span className="text-xs text-dusk"> · {statusLabel}</span>
                    )}
                    <PrivacyToggle isPublic={item.is_public} onToggle={() => togglePublic(item)} />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm shrink-0"
                  >
                    {tr.delete}
                  </button>
                </div>
                <LinkField url={item.link_url} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
