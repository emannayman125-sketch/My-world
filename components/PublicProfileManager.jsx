"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Globe, Lock, Pencil, ChevronDown } from "lucide-react";

const KIND_EMOJI = { music: "🎵", movie: "🎬", podcast: "🎙️", book: "📚", place: "✈️", hobby: "🎮" };
const CURRENTLY_EMOJI = { listening: "🎧", watching: "🎬", reading: "📚" };

// One place to see — and flip — exactly what shows on the public page.
// No navigating away to three different sections to piece it together.
function Row({ label, sub, isPublic, onToggle, strings: s }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{label}</p>
        {sub && <p className="text-xs text-ink-muted dark:text-moon-muted truncate">{sub}</p>}
      </div>
      <button
        onClick={onToggle}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
          isPublic
            ? "bg-sage/15 text-sage dark:text-sage-soft"
            : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"
        }`}
      >
        {isPublic ? <Globe size={12} /> : <Lock size={12} />}
        {isPublic ? s.public : s.private}
      </button>
    </div>
  );
}

const BOOK_L = {
  rtl: {
    button: "ملخص وريفيو",
    summary: "الملخص",
    summaryPh: "اكتبي ملخص الكتاب بكلماتك: أهم الأفكار والدروس…",
    review: "رأيي في الكتاب",
    reviewPh: "إيه رأيك؟ إيه اللي عجبك وتنصحي بيه لمين؟",
    save: "حفظ",
    saved: "اتحفظ ✓",
    err: "حصلت مشكلة في الحفظ، جرّب تاني.",
    hint: "بيظهر تحت الكتاب في صفحتك العامة (لو الكتاب عام).",
  },
  ltr: {
    button: "Summary & review",
    summary: "Summary",
    summaryPh: "Write the book's key ideas and lessons in your own words…",
    review: "My review",
    reviewPh: "What did you think, and who would you recommend it to?",
    save: "Save",
    saved: "Saved ✓",
    err: "Couldn't save. Try again.",
    hint: "Shows under the book on your public page (if the book is public).",
  },
};

// A "summary & review" editor under each book: opens in place, saves
// both fields on the world_items row.
function BookNotesEditor({ book, supabase, onSaved, dir }) {
  const L = BOOK_L[dir] || BOOK_L.rtl;
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(book.summary || "");
  const [review, setReview] = useState(book.review || "");
  const [state, setState] = useState("idle"); // idle | saving | saved | error
  const has = !!(book.summary || book.review);

  async function save() {
    setState("saving");
    const patch = { summary: summary.trim() || null, review: review.trim() || null };
    const { error } = await supabase.from("world_items").update(patch).eq("id", book.id);
    if (error) { setState("error"); return; }
    onSaved(patch);
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="pb-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full bg-lantern/15 text-lantern-ink dark:text-lantern-soft text-xs px-3 py-1.5 hover:bg-lantern/25 transition"
      >
        <Pencil size={12} /> {L.button}
        {has && <span className="h-1.5 w-1.5 rounded-full bg-lantern" aria-hidden="true" />}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 rounded-soft border border-black/10 dark:border-white/10 p-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">{L.summary}</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={L.summaryPh}
              rows={5}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm leading-7 outline-none focus:border-sage resize-y"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">{L.review}</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={L.reviewPh}
              rows={3}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm leading-7 outline-none focus:border-sage resize-y"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={state === "saving"}
              className="rounded-soft bg-lantern text-night text-xs font-medium px-4 py-1.5 hover:brightness-105 transition disabled:opacity-50"
            >
              {L.save}
            </button>
            {state === "saved" && <span className="text-xs text-sage dark:text-sage-soft">{L.saved}</span>}
            {state === "error" && <span className="text-xs text-red-500">{L.err}</span>}
          </div>
          <p className="text-[11px] text-ink-muted dark:text-moon-muted">{L.hint}</p>
        </div>
      )}
    </div>
  );
}

export default function PublicProfileManager({ userId, initialWorld, initialCurrently, initialInterests, strings: s, worldKindLabels, currentlyKindLabels, dir = "rtl" }) {
  const supabase = createClient();
  const [world, setWorld] = useState(initialWorld || []);
  const [currently, setCurrently] = useState(initialCurrently || []);
  const [interests, setInterests] = useState(initialInterests || []);

  async function toggle(table, item, list, setList) {
    const next = !item.is_public;
    setList((l) => l.map((x) => (x.id === item.id ? { ...x, is_public: next } : x))); // optimistic
    const { error } = await supabase.from(table).update({ is_public: next }).eq("id", item.id);
    if (error) setList((l) => l.map((x) => (x.id === item.id ? { ...x, is_public: !next } : x))); // revert
  }

  const worldByKind = {};
  for (const item of world) {
    worldByKind[item.kind] = worldByKind[item.kind] || [];
    worldByKind[item.kind].push(item);
  }

  const empty = world.length === 0 && currently.length === 0 && interests.length === 0;

  return (
    <div className="space-y-5">
      {empty && <p className="text-sm text-ink-muted dark:text-moon-muted">{s.empty}</p>}

      {currently.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-1">{s.currently}</p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {currently.map((c) => (
              <Row
                key={c.id}
                label={`${CURRENTLY_EMOJI[c.kind] || ""} ${currentlyKindLabels[c.kind] || c.kind}: ${c.title}`}
                isPublic={c.is_public}
                onToggle={() => toggle("currently_items", c, currently, setCurrently)}
                strings={s}
              />
            ))}
          </div>
        </section>
      )}

      {Object.entries(worldByKind).map(([kind, items]) => (
        <section key={kind}>
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-1">
            {KIND_EMOJI[kind] || ""} {worldKindLabels[kind]?.label || kind}
          </p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((w) => (
              <div key={w.id}>
                <Row
                  label={w.title}
                  sub={w.subtitle}
                  isPublic={w.is_public}
                  onToggle={() => toggle("world_items", w, world, setWorld)}
                  strings={s}
                />
                {kind === "book" && (
                  <BookNotesEditor
                    book={w}
                    supabase={supabase}
                    dir={dir}
                    onSaved={(patch) => setWorld((l) => l.map((x) => (x.id === w.id ? { ...x, ...patch } : x)))}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {interests.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-1">{s.interests}</p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {interests.map((i) => (
              <Row
                key={i.id}
                label={i.value}
                isPublic={i.is_public}
                onToggle={() => toggle("interests", i, interests, setInterests)}
                strings={s}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
