"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import LinkField from "./LinkField";
import { todayISO } from "@/lib/time";

const PRIORITY_EMOJI = { high: "🔥", important: "⭐", normal: "○" };

export default function TasksManager({ userId, initialTasks, strings }) {
  const tr = strings.legacy.tasks;
  const PRIORITIES = {
    high: { emoji: "🔥", label: tr.priorities.high },
    important: { emoji: "⭐", label: tr.priorities.important },
    normal: { emoji: "○", label: tr.priorities.normal },
  };
  const supabase = createClient();
  const { confirm } = useConfirm();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [form, setForm] = useState({ title: "", priority: "normal", due_date: "", is_shared: false, link_url: "" });
  const [filter, setFilter] = useState("open");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const todayISO = todayISO();

  async function addTask(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        priority: form.priority,
        due_date: form.due_date || null,
        is_shared: form.is_shared,
        link_url: form.link_url.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks((list) => [data, ...list]);
      setForm({ title: "", priority: "normal", due_date: "", is_shared: false, link_url: "" });
      setShowLinkInput(false);
    }
  }

  async function toggleDone(task) {
    await supabase.from("tasks").update({ is_done: !task.is_done }).eq("id", task.id);
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, is_done: !t.is_done } : t)));
  }

  async function toggleShared(task) {
    const next = !task.is_shared;
    await supabase.from("tasks").update({ is_shared: next }).eq("id", task.id);
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, is_shared: next } : t)));
  }

  async function removeTask(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((list) => list.filter((t) => t.id !== id));
  }

  const visibleTasks = tasks
    .filter((t) => (filter === "open" ? !t.is_done : filter === "done" ? t.is_done : true))
    .sort((a, b) => {
      const order = { high: 0, important: 1, normal: 2 };
      return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
    });

  return (
    <div className="space-y-4">
      <form onSubmit={addTask} className="card p-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={tr.newTask}
            className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          >
            {Object.entries(PRIORITIES).map(([key, { emoji, label }]) => (
              <option key={key} value={key}>{emoji} {label}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <label className="flex items-center gap-1 text-xs text-ink-muted dark:text-moon-muted">
            <input
              type="checkbox"
              checked={form.is_shared}
              onChange={(e) => setForm({ ...form, is_shared: e.target.checked })}
            />
            {tr.shared}
          </label>
          <button
            type="button"
            onClick={() => setShowLinkInput((s) => !s)}
            className="text-xs text-dusk hover:underline"
          >
            {showLinkInput ? tr.hideLink : tr.addLink}
          </button>
          <button
            type="submit"
            className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105"
          >
            {tr.add}
          </button>
        </div>
        {showLinkInput && (
          <input
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder={tr.linkPlaceholder}
            className="w-full rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
        )}
      </form>

      <div className="flex gap-2 text-sm">
        {[["open", tr.filters.open], ["done", tr.filters.done], ["all", tr.filters.all]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 transition
              ${filter === key ? "bg-ink text-paper dark:bg-moon dark:text-night" : "bg-black/5 dark:bg-white/5"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card p-4">
        {visibleTasks.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noTasks}</p>
        )}
        <ul className="space-y-1">
          {visibleTasks.map((task) => (
            <li
              key={task.id}
              className="rounded-soft px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => toggleDone(task)}
                  className="flex items-center gap-3 text-right flex-1"
                >
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0
                      ${task.is_done ? "bg-sage border-sage text-white" : "border-ink-muted dark:border-moon-muted"}`}
                  >
                    {task.is_done ? "✓" : ""}
                  </span>
                  <span className={task.is_done ? "line-through text-ink-muted dark:text-moon-muted" : ""}>
                    {PRIORITY_EMOJI[task.priority]} {task.title}
                  </span>
                  {task.due_date && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        !task.is_done && task.due_date < todayISO
                          ? "bg-red-500/15 text-red-500"
                          : "text-ink-muted dark:text-moon-muted"
                      }`}
                    >
                      {!task.is_done && task.due_date < todayISO ? `${tr.overdue} — ${task.due_date}` : task.due_date}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => toggleShared(task)}
                  className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${task.is_shared ? "bg-dusk/15 text-dusk" : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"}`}
                >
                  {task.is_shared ? tr.sharedBadge : tr.sharedQuestion}
                </button>
                <button
                  onClick={() => removeTask(task.id)}
                  className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm"
                >
                  {tr.delete}
                </button>
              </div>
              <LinkField url={task.link_url} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
