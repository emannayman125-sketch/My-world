"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import PrivacyToggle from "./PrivacyToggle";

const CATEGORY_EMOJI = {
  "كتب": "📚", "فن": "🎨", "رياضة": "⚽", "تكنولوجيا": "💻",
  "سفر": "✈️", "تعلّم": "🧠", "قهوة": "☕", "هوايات": "🎮",
};
const CATEGORY_KEYS = Object.keys(CATEGORY_EMOJI);

export default function InterestsManager({ userId, initialInterests, strings }) {
  const tr = strings.legacy.interests;
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [interests, setInterests] = useState(initialInterests || []);
  const [category, setCategory] = useState(CATEGORY_KEYS[0]);
  const [value, setValue] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  async function addInterest(e) {
    e.preventDefault();
    if (!value.trim()) return;

    const { data, error } = await supabase
      .from("interests")
      .insert({ user_id: userId, category, value: value.trim(), is_public: isPublic })
      .select()
      .single();

    if (!error && data) {
      setInterests((list) => [...list, data]);
      setValue("");
      setIsPublic(false);
    }
  }

  async function togglePublic(item) {
    const next = !item.is_public;
    await supabase.from("interests").update({ is_public: next }).eq("id", item.id);
    setInterests((list) => list.map((i) => (i.id === item.id ? { ...i, is_public: next } : i)));
  }

  async function removeInterest(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("interests").delete().eq("id", id);
    setInterests((list) => list.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addInterest} className="card p-4 flex flex-wrap gap-2 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-soft border border-black/10 dark:border-white/10
                     bg-transparent px-2 py-2 text-sm outline-none focus:border-lantern"
        >
          {CATEGORY_KEYS.map((k) => (
            <option key={k} value={k}>{CATEGORY_EMOJI[k]} {tr.categories[k]}</option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={tr.addPlaceholder}
          className="flex-1 min-w-[150px] rounded-soft border border-black/10 dark:border-white/10
                     bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <button
          type="submit"
          className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105"
        >
          {tr.add}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-ink-muted dark:text-moon-muted w-full">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          {tr.showOnPublic}
        </label>
      </form>

      {CATEGORY_KEYS.map((k) => {
        const items = interests.filter((i) => i.category === k);
        if (items.length === 0) return null;
        return (
          <div key={k} className="card p-4">
            <h3 className="text-sm text-ink-muted dark:text-moon-muted mb-2">
              {CATEGORY_EMOJI[k]} {tr.categories[k]}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/5
                             px-3 py-1 text-sm"
                >
                  {item.value}
                  <PrivacyToggle isPublic={item.is_public} onToggle={() => togglePublic(item)} />
                  <button
                    onClick={() => removeInterest(item.id)}
                    aria-label={tr.delete}
                    className="text-ink-muted dark:text-moon-muted hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {interests.length === 0 && (
        <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noInterests}</p>
      )}
    </div>
  );
}
