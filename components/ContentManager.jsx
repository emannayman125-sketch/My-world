"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, ChevronDown, ChevronUp, Mic2, ExternalLink } from "lucide-react";

const STAGE_ORDER = ["idea", "research", "script", "recording", "editing", "ready", "published"];
const STAGE_COLOR = {
  idea: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  research: "bg-violet-500/15 text-violet-500",
  script: "bg-dusk/20 text-dusk",
  recording: "bg-violet-500/15 text-violet-500",
  editing: "bg-violet-500/15 text-violet-500",
  ready: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  published: "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400",
};

export default function ContentManager({ userId, initialItems, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const c = strings.creator;

  const [items, setItems] = useState(initialItems || []);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ title: "", hook: "", platform: "other" });
  const [saving, setSaving] = useState(false);

  async function addItem(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        hook: form.hook.trim() || null,
        platform: form.platform,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setItems((list) => [data, ...list]);
      setForm({ title: "", hook: "", platform: "other" });
      setOpen(false);
    }
  }

  async function cycleStage(item) {
    const next = STAGE_ORDER[(STAGE_ORDER.indexOf(item.status) + 1) % STAGE_ORDER.length];
    await supabase.from("content_items").update({ status: next }).eq("id", item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
  }

  async function updateField(item, field, value) {
    await supabase.from("content_items").update({ [field]: value }).eq("id", item.id);
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, [field]: value } : i)));
  }

  async function removeItem(id) {
    if (!(await confirm(c.confirmDelete))) return;
    await supabase.from("content_items").delete().eq("id", id);
    setItems((list) => list.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full studio-card studio-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-violet-500 transition">
          <Plus size={15} strokeWidth={2} />
          {c.addContent}
        </button>
      ) : (
        <form onSubmit={addItem} className="studio-card p-4 space-y-2">
          <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={c.contentTitle}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500" />
          <input value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })}
            placeholder={c.hook}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500" />
          <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500">
            {Object.entries(c.platforms).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.title.trim()}
              className="rounded-soft bg-violet-500 text-white text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50">
              {saving ? c.saving : c.save}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !open && (
        <EmptyState icon={Mic2} title={c.noContent} actionLabel={c.addContent} onAction={() => setOpen(true)} tone="violet" />
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="studio-card studio-card-hover overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-violet-500 shrink-0">
                <Mic2 size={15} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                {item.hook && <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{item.hook}</p>}
                <p className="text-[10px] text-ink-muted/70 dark:text-moon-muted/70 mt-1">{c.platforms[item.platform]}</p>
              </div>
              <button onClick={() => cycleStage(item)}
                className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium transition ${STAGE_COLOR[item.status] || STAGE_COLOR.idea}`}>
                {c.status[item.status] || c.status.idea}
              </button>
              <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="text-ink-muted/70 hover:text-ink dark:hover:text-moon transition shrink-0">
                {expanded === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => removeItem(item.id)} aria-label={c.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>

            {expanded === item.id && (
              <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 space-y-2 bg-black/[0.015] dark:bg-white/[0.02]">
                {[
                  ["script", "script"],
                  ["referencesText", "references_text"],
                  ["thumbnailIdea", "thumbnail_idea"],
                  ["recordingNotes", "recording_notes"],
                  ["notes", "notes"],
                ].map(([labelKey, field]) => (
                  <div key={field}>
                    <label className="text-xs text-ink-muted dark:text-moon-muted">{c[labelKey]}</label>
                    <textarea
                      defaultValue={item[field] || ""}
                      onBlur={(e) => updateField(item, field, e.target.value)}
                      rows={field === "script" ? 4 : 1}
                      className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                                 px-2 py-1.5 text-sm outline-none focus:border-violet-500 resize-none mt-0.5"
                    />
                  </div>
                ))}
                <div className="flex gap-2 items-center flex-wrap">
                  <input type="date" defaultValue={item.publish_date || ""}
                    onBlur={(e) => updateField(item, "publish_date", e.target.value || null)}
                    className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-violet-500" />
                  <input defaultValue={item.published_url || ""} placeholder={c.publishedUrl}
                    onBlur={(e) => updateField(item, "published_url", e.target.value || null)}
                    className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-violet-500" />
                  {item.published_url && (
                    <a href={item.published_url} target="_blank" rel="noreferrer" className="text-violet-500 shrink-0">
                      <ExternalLink size={14} strokeWidth={2} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
