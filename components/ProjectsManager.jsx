"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, Building2 } from "lucide-react";

const STATUS_COLOR = {
  planning: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  active: "bg-[#B8834D]/15 text-[#9c6a35] dark:text-[#d9a366]",
  on_hold: "bg-dusk/20 text-dusk",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function ProjectsManager({ userId, initialProjects, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const b = strings.business;
  const [projects, setProjects] = useState(initialProjects || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", deadline: "", budget: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function addProject(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("business_projects")
      .insert({
        user_id: userId,
        name: form.name.trim(),
        client: form.client.trim() || null,
        deadline: form.deadline || null,
        budget: form.budget ? Number(form.budget) : null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setProjects((list) => [data, ...list]);
      setForm({ name: "", client: "", deadline: "", budget: "", notes: "" });
      setOpen(false);
    }
  }

  async function cycleStatus(project) {
    const order = ["planning", "active", "on_hold", "completed"];
    const next = order[(order.indexOf(project.status) + 1) % order.length];
    await supabase.from("business_projects").update({ status: next }).eq("id", project.id);
    setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, status: next } : p)));
  }

  async function removeProject(id) {
    if (!(await confirm(b.confirmDeleteProject))) return;
    await supabase.from("business_projects").delete().eq("id", id);
    setProjects((list) => list.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full exec-card exec-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-[#B8834D] transition">
          <Plus size={15} strokeWidth={2} />
          {b.addProject}
        </button>
      ) : (
        <form onSubmit={addProject} className="exec-card p-4 space-y-2">
          <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={b.projectName}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D]" />
          <div className="flex gap-2 flex-wrap">
            <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder={b.client}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D]" />
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D]" />
            <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder={b.budget}
              className="w-28 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D]" />
          </div>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={b.notes} rows={2}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D] resize-none" />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.name.trim()}
              className="rounded-soft bg-[#B8834D] text-white text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50">
              {saving ? b.saving : b.save}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 && !open && (
        <EmptyState icon={Building2} title={b.noProjects} actionLabel={b.addProject} onAction={() => setOpen(true)} tone="copper" />
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {projects.map((p) => (
          <div key={p.id} className="exec-card exec-card-hover p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8834D]/15 text-[#9c6a35] dark:text-[#d9a366] shrink-0">
                  <Building2 size={15} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="font-medium text-sm">{p.name}</h3>
                  {p.client && <p className="text-xs text-ink-muted dark:text-moon-muted">{p.client}</p>}
                </div>
              </div>
              <button onClick={() => removeProject(p.id)} aria-label={b.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
            <button onClick={() => cycleStatus(p)}
              className={`mt-2 text-xs rounded-full px-2.5 py-1 font-medium transition ${STATUS_COLOR[p.status] || STATUS_COLOR.planning}`}>
              {b.status[p.status] || b.status.planning}
            </button>
            {(p.deadline || p.budget) && (
              <p className="text-xs text-ink-muted dark:text-moon-muted mt-2">
                {p.deadline && `📅 ${p.deadline}`}{p.deadline && p.budget && " · "}{p.budget && `💰 ${p.budget}`}
              </p>
            )}
            {p.notes && <p className="text-sm mt-2 leading-6">{p.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
