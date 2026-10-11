"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "./ToastProvider";

export default function BookNotes({ bookId, initialNotes, strings }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const l = strings.library;
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("library_books").update({ notes }).eq("id", bookId);
    setSaving(false);
    if (error) { showToast("حصلت مشكلة في الحفظ. جرّب تاني."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card p-4 space-y-2">
      <h2 className="text-sm font-medium">{l.notes}</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={l.notesPlaceholder}
        rows={4}
        className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                   px-3 py-2 text-sm outline-none focus:border-sage resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-soft bg-lantern text-night text-xs font-medium px-3 py-1.5
                     hover:brightness-105 transition disabled:opacity-50"
        >
          {l.saveNotes}
        </button>
        {saved && <span className="text-xs text-dusk">{l.saved}</span>}
      </div>
    </div>
  );
}
