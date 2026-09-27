"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { recomputeAndSaveStreak } from "@/lib/streaks";

const EMOJIS = ["📖", "🏃", "💧", "🧘", "🕌", "✍️", "🎯"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitsManager({ userId, initialHabits, initialLogsToday, strings }) {
  const tr = strings.legacy.habits;
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [habits, setHabits] = useState(initialHabits || []);
  const [doneToday, setDoneToday] = useState(new Set((initialLogsToday || []).map((l) => l.habit_id)));
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  async function addHabit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const { data, error } = await supabase
      .from("habits")
      .insert({ user_id: userId, name: name.trim(), emoji })
      .select()
      .single();

    if (!error && data) {
      setHabits((list) => [...list, data]);
      setName("");
    }
  }

  async function toggleToday(habit) {
    const isDone = doneToday.has(habit.id);

    if (isDone) {
      await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habit.id)
        .eq("done_date", todayISO());
      setDoneToday((s) => { const next = new Set(s); next.delete(habit.id); return next; });
    } else {
      await supabase.from("habit_logs").insert({ habit_id: habit.id, user_id: userId, done_date: todayISO() });
      setDoneToday((s) => new Set(s).add(habit.id));
    }

    const newStreak = await recomputeAndSaveStreak(supabase, habit.id, userId);
    setHabits((list) => list.map((h) => h.id === habit.id ? { ...h, current_streak: newStreak } : h));
  }

  async function removeHabit(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("habits").delete().eq("id", id);
    setHabits((list) => list.filter((h) => h.id !== id));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addHabit} className="card p-4 flex flex-wrap gap-2 items-center">
        <select
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-lantern"
        >
          {EMOJIS.map((em) => <option key={em} value={em}>{em}</option>)}
        </select>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tr.namePlaceholder}
          className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105">
          {tr.add}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {habits.map((habit) => {
          const done = doneToday.has(habit.id);
          return (
            <div key={habit.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{habit.emoji} {habit.name}</p>
                <p className="text-sm text-ink-muted dark:text-moon-muted">
                  {tr.streak}: {habit.current_streak} 🔥
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleToday(habit)}
                  className={`rounded-full w-10 h-10 flex items-center justify-center transition
                    ${done ? "bg-lantern text-night" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"}`}
                >
                  {done ? "✓" : ""}
                </button>
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm"
                >
                  {tr.delete}
                </button>
              </div>
            </div>
          );
        })}

        {habits.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noHabits}</p>
        )}
      </div>
    </div>
  );
}
