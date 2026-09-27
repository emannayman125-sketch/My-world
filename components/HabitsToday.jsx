"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { recomputeAndSaveStreak } from "@/lib/streaks";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitsToday({ userId, habits, initialLogsToday, strings }) {
  const supabase = createClient();
  const [doneToday, setDoneToday] = useState(new Set((initialLogsToday || []).map((l) => l.habit_id)));

  if (!habits || habits.length === 0) return null;

  async function toggle(habit) {
    const isDone = doneToday.has(habit.id);
    if (isDone) {
      await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("done_date", todayISO());
      setDoneToday((s) => { const next = new Set(s); next.delete(habit.id); return next; });
    } else {
      await supabase.from("habit_logs").insert({ habit_id: habit.id, user_id: userId, done_date: todayISO() });
      setDoneToday((s) => new Set(s).add(habit.id));
    }
    await recomputeAndSaveStreak(supabase, habit.id, userId);
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl mb-3">{strings.dashboard.habitsToday.heading}</h2>
      <div className="flex flex-wrap gap-2">
        {habits.map((h) => {
          const done = doneToday.has(h.id);
          return (
            <button
              key={h.id}
              onClick={() => toggle(h)}
              className={`rounded-full px-3 py-1.5 text-sm transition
                ${done ? "bg-lantern text-night" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"}`}
            >
              {h.emoji} {h.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
