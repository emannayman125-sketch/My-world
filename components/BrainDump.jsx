"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Sparkles, CheckSquare, Lightbulb } from "lucide-react";

const PRIORITY_MAP = { high: "high", medium: "important", low: "normal" };

export default function BrainDump({ userId, strings, locale }) {
  const ai = strings.ai;
  const supabase = createClient();
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState(null);
  const [notes, setNotes] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function extract() {
    if (!text.trim()) return;
    setExtracting(true);
    setError("");
    setTasks(null);
    setNotes(null);
    setSavedMsg("");

    try {
      const res = await fetch("/api/ai/brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error === "no_api_key" ? ai.errorNoKey : ai.errorGeneric);
        setExtracting(false);
        return;
      }

      setTasks((data.tasks || []).map((t) => ({ ...t, selected: true })));
      setNotes((data.notes || []).map((n) => ({ ...n, selected: true })));
    } catch {
      setError(ai.errorGeneric);
    }
    setExtracting(false);
  }

  function toggleTask(i) {
    setTasks((list) => list.map((t, idx) => (idx === i ? { ...t, selected: !t.selected } : t)));
  }
  function toggleNote(i) {
    setNotes((list) => list.map((n, idx) => (idx === i ? { ...n, selected: !n.selected } : n)));
  }
  function editTaskTitle(i, value) {
    setTasks((list) => list.map((t, idx) => (idx === i ? { ...t, title: value } : t)));
  }
  function editNoteTitle(i, value) {
    setNotes((list) => list.map((n, idx) => (idx === i ? { ...n, title: value } : n)));
  }

  async function saveSelected() {
    setSaving(true);
    const selectedTasks = (tasks || []).filter((t) => t.selected && t.title.trim());
    const selectedNotes = (notes || []).filter((n) => n.selected && n.title.trim());

    if (selectedTasks.length > 0) {
      await supabase.from("tasks").insert(
        selectedTasks.map((t) => ({
          user_id: userId,
          title: t.title.trim(),
          due_date: t.due_date || null,
          priority: PRIORITY_MAP[t.priority] || "normal",
        }))
      );
    }
    if (selectedNotes.length > 0) {
      await supabase.from("notes").insert(
        selectedNotes.map((n) => ({
          user_id: userId,
          kind: n.kind || "idea",
          content: n.title.trim(),
        }))
      );
    }

    setSaving(false);
    setSavedMsg(`${ai.savedCount}: ${selectedTasks.length + selectedNotes.length}`);
    setTasks(null);
    setNotes(null);
    setText("");
  }

  const hasResults = tasks !== null || notes !== null;
  const nothingFound = hasResults && tasks.length === 0 && notes.length === 0;

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ai.brainDumpPlaceholder}
          rows={5}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                     px-4 py-3 text-sm outline-none focus:border-lantern resize-none"
        />
        <button
          onClick={extract}
          disabled={extracting || !text.trim()}
          className="flex items-center gap-2 rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2.5
                     hover:brightness-105 transition disabled:opacity-50"
        >
          <Sparkles size={15} strokeWidth={2} />
          {extracting ? ai.extracting : ai.extract}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {savedMsg && <p className="text-sm text-dusk">{savedMsg} ✓</p>}
      </div>

      {nothingFound && (
        <p className="text-sm text-ink-muted dark:text-moon-muted text-center py-4">{ai.noExtracted}</p>
      )}

      {hasResults && !nothingFound && (
        <div className="card p-4 space-y-4">
          {tasks.length > 0 && (
            <div>
              <h3 className="text-xs text-ink-muted dark:text-moon-muted mb-2 flex items-center gap-1.5">
                <CheckSquare size={13} strokeWidth={2} /> {ai.extractedTasks}
              </h3>
              <div className="space-y-1.5">
                {tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="checkbox" checked={t.selected} onChange={() => toggleTask(i)} className="accent-lantern shrink-0" />
                    <input
                      value={t.title}
                      onChange={(e) => editTaskTitle(i, e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-lantern py-1"
                    />
                    <span className="text-[10px] shrink-0 rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-ink-muted dark:text-moon-muted">
                      {ai.priority[t.priority] || ai.priority.medium}
                    </span>
                    {t.due_date && (
                      <span className="text-[10px] shrink-0 text-ink-muted dark:text-moon-muted">{t.due_date}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length > 0 && (
            <div>
              <h3 className="text-xs text-ink-muted dark:text-moon-muted mb-2 flex items-center gap-1.5">
                <Lightbulb size={13} strokeWidth={2} /> {ai.extractedNotes}
              </h3>
              <div className="space-y-1.5">
                {notes.map((n, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="checkbox" checked={n.selected} onChange={() => toggleNote(i)} className="accent-lantern shrink-0" />
                    <input
                      value={n.title}
                      onChange={(e) => editNoteTitle(i, e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none border-b border-transparent focus:border-lantern py-1"
                    />
                    <span className="text-[10px] shrink-0 rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-ink-muted dark:text-moon-muted">
                      {ai.noteKindLabel[n.kind] || ai.noteKindLabel.idea}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={saveSelected}
            disabled={saving}
            className="rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50"
          >
            {saving ? ai.saving : ai.confirmSave}
          </button>
        </div>
      )}
    </div>
  );
}
