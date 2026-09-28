"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, ChevronDown, ChevronUp, ExternalLink, FlaskConical } from "lucide-react";

const STATUS_ORDER = ["idea", "researching", "draft", "reviewing", "finished"];
const STATUS_COLOR = {
  idea: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  researching: "bg-sage/20 text-sage dark:text-sage-soft",
  draft: "bg-dusk/20 text-dusk",
  reviewing: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  finished: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

export default function ResearchWorkspace({ userId, initialResearch, initialNotes, courses, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const m = strings.mba;

  const [projects, setProjects] = useState(initialResearch || []);
  const [notesByResearch, setNotesByResearch] = useState(() => {
    const map = {};
    (initialNotes || []).forEach((n) => {
      if (!n.research_id) return;
      map[n.research_id] = [...(map[n.research_id] || []), n];
    });
    return map;
  });
  const [expanded, setExpanded] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", question: "", course_id: "", deadline: "" });
  const [saving, setSaving] = useState(false);

  async function addProject(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("research_projects")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        question: form.question.trim() || null,
        course_id: form.course_id || null,
        deadline: form.deadline || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setProjects((list) => [data, ...list]);
      setForm({ title: "", question: "", course_id: "", deadline: "" });
      setOpen(false);
      setExpanded(data.id);
    }
  }

  async function cycleStatus(project) {
    const idx = STATUS_ORDER.indexOf(project.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    await supabase.from("research_projects").update({ status: next }).eq("id", project.id);
    setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, status: next } : p)));
  }

  async function removeProject(id) {
    if (!(await confirm(m.confirmDeleteResearch))) return;
    await supabase.from("research_projects").delete().eq("id", id);
    setProjects((list) => list.filter((p) => p.id !== id));
  }

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
          {m.addResearch}
        </button>
      ) : (
        <form onSubmit={addProject} className="card p-4 space-y-2">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={m.researchTitle}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder={m.researchQuestion}
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
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
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

      {projects.length === 0 && !open && (
        <EmptyState icon={FlaskConical} title={m.noResearch} actionLabel={m.addResearch} onAction={() => setOpen(true)} />
      )}

      <div className="space-y-2">
        {projects.map((p) => (
          <div key={p.id} className="card overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <button
                onClick={() => cycleStatus(p)}
                className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium transition ${STATUS_COLOR[p.status] || STATUS_COLOR.idea}`}
              >
                {m.researchStatus[p.status] || m.researchStatus.idea}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                {p.question && <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{p.question}</p>}
                <p className="text-xs text-ink-muted/70 dark:text-moon-muted/70 mt-1">
                  {courseName(p.course_id) || m.noCourse}
                  {p.deadline && ` · ${m.deadline}: ${p.deadline}`}
                </p>
              </div>
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                aria-label={m.notes}
                className="text-ink-muted/70 hover:text-ink dark:hover:text-moon transition shrink-0"
              >
                {expanded === p.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={() => removeProject(p.id)}
                aria-label={m.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>

            {expanded === p.id && (
              <ResearchNotes
                researchId={p.id}
                userId={userId}
                notes={notesByResearch[p.id] || []}
                onChange={(updater) =>
                  setNotesByResearch((map) => ({ ...map, [p.id]: updater(map[p.id] || []) }))
                }
                strings={strings}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchNotes({ researchId, userId, notes, onChange, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const m = strings.mba;
  const [text, setText] = useState("");
  const [kind, setKind] = useState("note");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("research_notes")
      .insert({
        user_id: userId,
        research_id: researchId,
        kind,
        content: text.trim(),
        url: url.trim() || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      onChange((list) => [data, ...list]);
      setText("");
      setUrl("");
      setKind("note");
    }
  }

  async function removeNote(id) {
    if (!(await confirm(m.confirmDeleteNote))) return;
    await supabase.from("research_notes").delete().eq("id", id);
    onChange((list) => list.filter((n) => n.id !== id));
  }

  return (
    <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 py-3 space-y-3 bg-black/[0.015] dark:bg-white/[0.02]">
      <form onSubmit={addNote} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={m.noteContent}
          rows={2}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                     px-3 py-2 text-sm outline-none focus:border-sage resize-none"
        />
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-2 py-1.5 text-xs outline-none focus:border-sage"
          >
            {Object.entries(m.noteKind).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={m.noteUrl}
            className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-2 py-1.5 text-xs outline-none focus:border-sage"
          />
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="rounded-soft bg-lantern text-night text-xs font-medium px-3 py-1.5
                       hover:brightness-105 transition disabled:opacity-50"
          >
            {saving ? m.saving : m.addNote}
          </button>
        </div>
      </form>

      {notes.length > 0 && (
        <div className="space-y-1.5">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start gap-2 text-sm rounded-soft bg-paper-card/60 dark:bg-night-card/40 px-3 py-2">
              <span className="text-[10px] shrink-0 mt-1 rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-ink-muted dark:text-moon-muted">
                {m.noteKind[n.kind] || m.noteKind.note}
              </span>
              <p className="flex-1 leading-6">{n.content}</p>
              {n.url && (
                <a href={n.url} target="_blank" rel="noreferrer" className="shrink-0 text-sage dark:text-sage-soft">
                  <ExternalLink size={13} strokeWidth={2} />
                </a>
              )}
              <button onClick={() => removeNote(n.id)} className="shrink-0 text-ink-muted/60 hover:text-red-500 transition">
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
