"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { useToast } from "./ToastProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, GraduationCap } from "lucide-react";

export default function CoursesManager({ userId, initialCourses, strings, program = "mba", partnerName = "" }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const m = strings.mba;
  const [courses, setCourses] = useState(initialCourses || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", professor: "", schedule: "", description: "", is_shared: false });
  const [saving, setSaving] = useState(false);

  async function addCourse(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("mba_courses")
      .insert({
        user_id: userId,
        program,
        name: form.name.trim(),
        professor: form.professor.trim() || null,
        schedule: form.schedule.trim() || null,
        description: form.description.trim() || null,
        is_shared: form.is_shared,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setCourses((list) => [data, ...list]);
      setForm({ name: "", professor: "", schedule: "", description: "", is_shared: false });
      setOpen(false);
    }
  }

  async function toggleShared(course) {
    const next = !course.is_shared;
    const { error } = await supabase.from("mba_courses").update({ is_shared: next }).eq("id", course.id);
    if (error) { showToast("حصلت مشكلة، جرّب تاني."); return; }
    setCourses((list) => list.map((c) => (c.id === course.id ? { ...c, is_shared: next } : c)));
  }

  async function removeCourse(id) {
    if (!(await confirm(m.confirmDeleteCourse))) return;
    const { error } = await supabase.from("mba_courses").delete().eq("id", id);
    if (error) { showToast("حصلت مشكلة، جرّب تاني."); return; }
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
          {partnerName && (
            <label className="flex items-center gap-2 text-sm text-ink-muted dark:text-moon-muted">
              <input
                type="checkbox"
                checked={form.is_shared}
                onChange={(e) => setForm({ ...form, is_shared: e.target.checked })}
                className="h-4 w-4 accent-[#6F4FC4]"
              />
              {m.shareWith.replace("{name}", partnerName)}
            </label>
          )}
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
            {partnerName && (
              <button
                onClick={() => toggleShared(c)}
                className={`mt-2 text-xs rounded-full px-2 py-0.5 transition ${
                  c.is_shared ? "bg-dusk/15 text-dusk" : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"
                }`}
              >
                {c.is_shared ? m.sharedBadge.replace("{name}", partnerName) : m.shareWith.replace("{name}", partnerName)}
              </button>
            )}
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
