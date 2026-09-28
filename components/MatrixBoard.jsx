"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { GripVertical, LayoutGrid } from "lucide-react";
import EmptyState from "./EmptyState";

const QUADRANTS = [
  { key: "do_first", color: "border-t-red-500" },
  { key: "schedule", color: "border-t-emerald-500" },
  { key: "delegate", color: "border-t-amber-500" },
  { key: "eliminate", color: "border-t-black/20 dark:border-t-white/20" },
];

export default function MatrixBoard({ userId, initialTasks, strings }) {
  const supabase = createClient();
  const m = strings.matrix;
  const [tasks, setTasks] = useState(initialTasks || []);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  async function moveTask(taskId, quadrant) {
    setTasks((list) => list.map((t) => (t.id === taskId ? { ...t, quadrant } : t)));
    await supabase.from("tasks").update({ quadrant }).eq("id", taskId);
  }

  function handleDrop(e, quadrantKey) {
    e.preventDefault();
    setDragOverKey(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) moveTask(taskId, quadrantKey);
  }

  const unsorted = tasks.filter((t) => !t.quadrant);

  if (tasks.length === 0) {
    return (
      <EmptyState icon={LayoutGrid} title={m.noTasks} actionLabel={strings.nav.tasks} actionHref="/tasks" />
    );
  }

  return (
    <div className="space-y-5">
      {unsorted.length > 0 && (
        <div>
          <p className="text-xs text-ink-muted dark:text-moon-muted mb-2">{m.unsorted}</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {unsorted.map((t) => (
              <TaskChip key={t.id} task={t} onDragStart={setDraggingId} onDragEnd={() => setDraggingId(null)} />
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => {
          const items = tasks.filter((t) => t.quadrant === q.key);
          return (
            <div
              key={q.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverKey(q.key); }}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => handleDrop(e, q.key)}
              className={`card border-t-4 ${q.color} p-4 min-h-[140px] transition-colors ${
                dragOverKey === q.key ? "bg-black/[0.03] dark:bg-white/[0.05]" : ""
              }`}
            >
              <p className="font-display text-lg">{m.quadrants[q.key]}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted mb-3">{m.quadrantHints[q.key]}</p>
              <div className="space-y-1.5">
                {items.length === 0 && (
                  <p className="text-xs text-ink-muted/60 dark:text-moon-muted/60">{m.empty}</p>
                )}
                {items.map((t) => (
                  <TaskChip key={t.id} task={t} onDragStart={setDraggingId} onDragEnd={() => setDraggingId(null)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskChip({ task, onDragStart, onDragEnd }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      className="flex items-center gap-1.5 rounded-soft border border-black/10 dark:border-white/10
                 bg-paper-card dark:bg-night-card px-3 py-2 text-sm cursor-grab active:cursor-grabbing shrink-0
                 hover:border-sage/50 transition"
    >
      <GripVertical size={13} strokeWidth={2} className="text-ink-muted/50 shrink-0" />
      <span className="truncate max-w-[200px]">{task.title}</span>
    </div>
  );
}
