"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, GraduationCap } from "lucide-react";

export default function CoursesManager({ userId, initialCourses, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const m = strings.mba;
  const [courses, setCourses] = useState(initialCourses || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", professor: "", schedule: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function addCourse(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("mba_courses")
      .insert({
        user_id: userId,
        name: form.name.trim(),
        professor: form.professor.trim() || null,
        schedule: form.schedule.trim() || null,
        description: form.description.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setCourses((list) => [data, ...list]);
      setForm({ name: "", professor: "", schedule: "", description: "" });
      setOpen(false);
    }
  }

  async function removeCourse(id) {
    if (!(await confirm(m.confirmDeleteCourse))) return;
    await supabase.from("mba_courses").delete().eq("id", id);
    setCourses((list) => list.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm
                     text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon transition"
        >
          <Plus size={15} strokeWidth={2} />
          {m.addCourse}
        </button>
      ) : (
        <form onSubmit={addCourse} className="card p-4 space-y-2">
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={m.courseName}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <div className="flex gap-2 flex-wrap">
            <input
              value={form.professor}
              onChange={(e) => setForm({ ...form, professor: e.target.value })}
              placeholder={m.professor}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder={m.schedule}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={m.description}
            rows={2}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-3 py-2 text-sm outline-none focus:border-sage resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
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

      {courses.length === 0 && !open && (
        <EmptyState icon={GraduationCap} title={m.noCourses} actionLabel={m.addCourse} onAction={() => setOpen(true)} />
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {courses.map((c) => (
          <div key={c.id} className="card card-hover p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
                  <GraduationCap size={15} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="font-medium text-sm">{c.name}</h3>
                  {c.professor && (
                    <p className="text-xs text-ink-muted dark:text-moon-muted">{c.professor}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeCourse(c.id)}
                aria-label={m.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
            {c.schedule && (
              <p className="text-xs text-ink-muted dark:text-moon-muted mt-2">🕐 {c.schedule}</p>
            )}
            {c.description && (
              <p className="text-sm mt-2 leading-6">{c.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
