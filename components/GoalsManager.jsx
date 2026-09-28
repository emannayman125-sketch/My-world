"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import LinkField from "./LinkField";

export default function GoalsManager({ userId, initialGoals, strings }) {
  const tr = strings.legacy.goals;
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [goals, setGoals] = useState(initialGoals || []);
  const [form, setForm] = useState({ title: "", period: "weekly", is_shared: false, link_url: "" });

  async function addGoal(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        period: form.period,
        is_shared: form.is_shared,
        link_url: form.link_url.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setGoals((list) => [...list, data]);
      setForm({ title: "", period: form.period, is_shared: false, link_url: "" });
    }
  }

  async function updateProgress(goal, progress) {
    await supabase.from("goals").update({ progress }).eq("id", goal.id);
    setGoals((list) => list.map((g) => (g.id === goal.id ? { ...g, progress } : g)));
  }

  async function removeGoal(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("goals").delete().eq("id", id);
    setGoals((list) => list.filter((g) => g.id !== id));
  }

  function renderSection(period, title) {
    const items = goals.filter((g) => g.period === period);
    return (
      <div className="card p-4">
        <h3 className="font-display text-lg mb-3">{title}</h3>
        {items.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted mb-2">{tr.noGoals}</p>
        )}
        <div className="space-y-4">
          {items.map((goal) => (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">
                  {goal.title} {goal.is_shared && <span className="text-xs text-dusk">· {tr.shared}</span>}
                </span>
                <button onClick={() => removeGoal(goal.id)} className="text-xs text-ink-muted dark:text-moon-muted hover:text-red-500">
                  {tr.delete}
                </button>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-sage transition-all" style={{ width: `${goal.progress}%` }} />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                onChange={(e) => updateProgress(goal, Number(e.target.value))}
                className="w-full mt-1"
              />
              <LinkField url={goal.link_url} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addGoal} className="card p-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={tr.newGoal}
            className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <select
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          >
            <option value="weekly">{tr.weekly}</option>
            <option value="monthly">{tr.monthly}</option>
          </select>
          <label className="flex items-center gap-1 text-sm text-ink-muted dark:text-moon-muted">
            <input
              type="checkbox"
              checked={form.is_shared}
              onChange={(e) => setForm({ ...form, is_shared: e.target.checked })}
            />
            {tr.sharedWithSomeone}
          </label>
          <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105">
            {tr.add}
          </button>
        </div>
        <input
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          placeholder={tr.linkPlaceholder}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
        />
      </form>

      {renderSection("weekly", tr.weeklyGoals)}
      {renderSection("monthly", tr.monthlyGoals)}
    </div>
  );
}
