"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "./ToastProvider";
import Confetti from "./Confetti";
import FocusMode from "./FocusMode";
import EmptyState from "./EmptyState";
import { CheckSquare } from "lucide-react";
import { todayISO } from "@/lib/time";

export default function TopThree({ userId, initialTasks, strings }) {
  const tr = strings.dashboard.topThree;
  const supabase = createClient();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [newTitle, setNewTitle] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [focusTask, setFocusTask] = useState(null);

  async function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim() || tasks.length >= 3) return;

    const { data, error } = await supabase
      .from("top3_tasks")
      .insert({ user_id: userId, title: newTitle.trim(), for_date: todayISO() })
      .select()
      .single();

    if (!error && data) {
      setTasks((t) => [...t, data]);
      setNewTitle("");
    }
  }

  async function toggleDone(task) {
    const { error } = await supabase
      .from("top3_tasks")
      .update({ is_done: !task.is_done })
      .eq("id", task.id);

    if (!error) {
      const updated = tasks.map((t) => (t.id === task.id ? { ...t, is_done: !t.is_done } : t));
      setTasks(updated);

      const allDone = updated.length === 3 && updated.every((t) => t.is_done);
      if (allDone && !task.is_done) {
        setCelebrate(true);
        showToast(tr.allDoneToast);
      }
    }
  }

  async function markDoneFromFocus(task) {
    if (task.is_done) return;
    await toggleDone(task);
  }

  const doneCount = tasks.filter((t) => t.is_done).length;

  return (
    <div className="card p-6">
      {celebrate && <Confetti onDone={() => setCelebrate(false)} />}
      {focusTask && (
        <FocusMode
          taskTitle={focusTask.title}
          onClose={() => setFocusTask(null)}
          onTaskDone={() => markDoneFromFocus(focusTask)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl">{tr.heading}</h2>
        <span className="text-sm text-ink-muted dark:text-moon-muted">
          {doneCount}/{tasks.length || 3}
        </span>
      </div>

      {tasks.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              <button
                onClick={() => toggleDone(task)}
                className="flex-1 flex items-center gap-3 text-right rounded-soft px-3 py-2
                           hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0
                    ${task.is_done
                      ? "bg-sage border-sage text-white"
                      : "border-ink-muted dark:border-moon-muted"}`}
                >
                  {task.is_done ? "✓" : ""}
                </span>
                <span className={task.is_done ? "line-through text-ink-muted dark:text-moon-muted" : ""}>
                  {task.title}
                </span>
              </button>
              {!task.is_done && (
                <button
                  onClick={() => setFocusTask(task)}
                  title={tr.focusTitle}
                  className="text-xs rounded-full bg-dusk/15 text-dusk px-3 py-1.5 hover:bg-dusk/25 shrink-0"
                >
                  {tr.focusLabel}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={CheckSquare} title={tr.empty} />
      )}

      {tasks.length < 3 && (
        <form onSubmit={addTask} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={tr.addPlaceholder}
            className="flex-1 rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <button
            type="submit"
            className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105"
          >
            {tr.add}
          </button>
        </form>
      )}
    </div>
  );
}
