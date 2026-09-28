"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, ClipboardList } from "lucide-react";

const STATUS_ORDER = ["not_started", "in_progress", "submitted", "completed"];
const STATUS_COLOR = {
  not_started: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  in_progress: "bg-sage/20 text-sage dark:text-sage-soft",
  submitted: "bg-dusk/20 text-dusk",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function AssignmentsManager({ userId, initialAssignments, courses, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const m = strings.mba;
  const [items, setItems] = useState(initialAssignments || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", course_id: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  async function addAssignment(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("mba_assignments")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        course_id: form.course_id || null,
        due_date: form.due_date || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setItems((list) => [...list, data]);
      setForm({ title: "", course_id: "", due_date: "" });
      setOpen(false);
    }
  }

  async function cycleStatus(item) {
    const idx = STATUS_ORDER.indexOf(item.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    await supabase.from("mba_assignments").update({ status: next }).eq("id", item.id);
    setItems((list) => list.map((a) => (a.id === item.id ? { ...a, status: next } : a)));
  }

  async function removeAssignment(id) {
    if (!(await confirm(m.confirmDeleteAssignment))) return;
    await supabase.from("mba_assignments").delete().eq("id", id);
    setItems((list) => list.filter((a) => a.id !== id));
  }

  const sorted = [...items].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  function courseName(id) {
    return courses.find((c) => c.id === id)?.name;
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm
                     text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon transition"
        >
          <Plus size={15} strokeWidth={2} />
          {m.addAssignment}
        </button>
      ) : (
        <form onSubmit={addAssignment} className="card p-4 space-y-2">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={m.assignmentTitle}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sage"
            >
              <option value="">{m.noCourse}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2
                         hover:brightness-105 transition disabled:opacity-50"
            >
              {saving ? m.saving : m.save}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
            >
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && !open && (
        <EmptyState icon={ClipboardList} title={m.noAssignments} actionLabel={m.addAssignment} onAction={() => setOpen(true)} />
      )}

      <div className="space-y-2">
        {sorted.map((a) => (
          <div key={a.id} className="card p-3 flex items-center gap-3">
            <button
              onClick={() => cycleStatus(a)}
              className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium transition ${STATUS_COLOR[a.status] || STATUS_COLOR.not_started}`}
            >
              {m.status[a.status] || m.status.not_started}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{a.title}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">
                {courseName(a.course_id) || m.noCourse}
                {a.due_date && ` · ${a.due_date}`}
              </p>
            </div>
            <button
              onClick={() => removeAssignment(a.id)}
              aria-label={m.delete}
              className="text-ink-muted/60 hover:text-red-500 transition shrink-0"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
