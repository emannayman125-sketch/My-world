"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "./ToastProvider";

const LABELS = {
  ar: {
    summary: "ملخصي للكتاب",
    summaryPh: "اكتبي هنا ملخص الكتاب بكلماتك: أهم الأفكار والدروس…",
    review: "رأيي في الكتاب (ريڤيو)",
    reviewPh: "إيه رأيك؟ اعجبك إيه، وإيه اللي مش عاجبك، وتنصحي بيه لمين؟",
    save: "حفظ",
    saved: "اتحفظ ✓",
    saveError: "حصلت مشكلة في الحفظ. جرّب تاني.",
  },
  en: {
    summary: "My summary",
    summaryPh: "Write the book's key ideas and lessons in your own words…",
    review: "My review",
    reviewPh: "What did you think? What worked, what didn't, who would you recommend it to?",
    save: "Save",
    saved: "Saved ✓",
    saveError: "Couldn't save. Try again.",
  },
};

// Everything the reader writes about a book, under the book itself:
// a summary, a review, and free notes. Each saves on its own.
export default function BookNotes({ bookId, initialNotes, initialSummary, initialReview, strings, locale = "ar" }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const l = strings.library;
  const L = LABELS[locale] || LABELS.ar;

  const fields = [
    { key: "summary", title: L.summary, ph: L.summaryPh, rows: 6, init: initialSummary },
    { key: "review", title: L.review, ph: L.reviewPh, rows: 5, init: initialReview },
    { key: "notes", title: l.notes, ph: l.notesPlaceholder, rows: 4, init: initialNotes },
  ];
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.init || ""])));
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  async function save(key) {
    setSavingKey(key);
    const { error } = await supabase.from("library_books").update({ [key]: values[key] }).eq("id", bookId);
    setSavingKey(null);
    if (error) { showToast(L.saveError); return; }
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2000);
  }

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="card p-4 space-y-2">
          <h2 className="font-display text-lg">{f.title}</h2>
          <textarea
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.ph}
            rows={f.rows}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-3 py-2 text-sm leading-7 outline-none focus:border-sage resize-y"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => save(f.key)}
              disabled={savingKey === f.key}
              className="rounded-soft bg-lantern text-night text-xs font-medium px-3 py-1.5
                         hover:brightness-105 transition disabled:opacity-50"
            >
              {L.save}
            </button>
            {savedKey === f.key && <span className="text-xs text-dusk">{L.saved}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
