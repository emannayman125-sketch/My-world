"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const STAGE_ORDER = ["idea", "research", "plan", "execute"];
const STAGE_COLOR = {
  idea: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  research: "bg-[#B8834D]/15 text-[#9c6a35] dark:text-[#d9a366]",
  plan: "bg-dusk/20 text-dusk",
  execute: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function IdeasManager({ userId, initialIdeas, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const b = strings.business;
  const [ideas, setIdeas] = useState(initialIdeas || []);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function addIdea(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("business_ideas")
      .insert({ user_id: userId, title: form.title.trim(), description: form.description.trim() || null })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setIdeas((list) => [data, ...list]);
      setForm({ title: "", description: "" });
      setOpen(false);
    }
  }

  async function cycleStage(idea) {
    const next = STAGE_ORDER[(STAGE_ORDER.indexOf(idea.stage) + 1) % STAGE_ORDER.length];
    await supabase.from("business_ideas").update({ stage: next }).eq("id", idea.id);
    setIdeas((list) => list.map((i) => (i.id === idea.id ? { ...i, stage: next } : i)));
  }

  async function updateField(idea, field, value) {
    await supabase.from("business_ideas").update({ [field]: value }).eq("id", idea.id);
    setIdeas((list) => list.map((i) => (i.id === idea.id ? { ...i, [field]: value } : i)));
  }

  async function removeIdea(id) {
    if (!(await confirm(b.confirmDeleteIdea))) return;
    await supabase.from("business_ideas").delete().eq("id", id);
    setIdeas((list) => list.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full exec-card exec-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-[#B8834D] transition">
          <Plus size={15} strokeWidth={2} />
          {b.addIdea}
        </button>
      ) : (
        <form onSubmit={addIdea} className="exec-card p-4 space-y-2">
          <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={b.ideaTitle}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D]" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={b.description} rows={2}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#B8834D] resize-none" />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.title.trim()}
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

      {ideas.length === 0 && !open && (
        <EmptyState icon={Lightbulb} title={b.noIdeas} actionLabel={b.addIdea} onAction={() => setOpen(true)} tone="copper" />
      )}

      <div className="space-y-2">
        {ideas.map((idea) => (
          <div key={idea.id} className="exec-card overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B8834D]/15 text-[#9c6a35] dark:text-[#d9a366] shrink-0">
                <Lightbulb size={15} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{idea.title}</p>
                {idea.description && <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{idea.description}</p>}
              </div>
              <button onClick={() => cycleStage(idea)}
                className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium transition ${STAGE_COLOR[idea.stage] || STAGE_COLOR.idea}`}>
                {b.stage[idea.stage] || b.stage.idea}
              </button>
              <button onClick={() => setExpanded(expanded === idea.id ? null : idea.id)}
                className="text-ink-muted/70 hover:text-ink dark:hover:text-moon transition shrink-0">
                {expanded === idea.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => removeIdea(idea.id)} aria-label={b.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>

            {expanded === idea.id && (
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 space-y-2 bg-black/[0.015] dark:bg-white/[0.02]">
                {[
                  ["marketResearch", "market_research"],
                  ["costs", "costs"],
                  ["opportunities", "opportunities"],
                  ["risks", "risks"],
                  ["nextActions", "next_actions"],
                ].map(([labelKey, field]) => (
                  <div key={field}>
                    <label className="text-xs text-ink-muted dark:text-moon-muted">{b[labelKey]}</label>
                    <textarea
                      defaultValue={idea[field] || ""}
                      onBlur={(e) => updateField(idea, field, e.target.value)}
                      rows={1}
                      className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                                 px-2 py-1.5 text-sm outline-none focus:border-[#B8834D] resize-none mt-0.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
