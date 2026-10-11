"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { GraduationCap, Sparkles } from "lucide-react";

export default function EnglishSessionLogger({ userId, messages, strings }) {
  const ai = strings.ai;
  const en = strings.english;
  const supabase = createClient();
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [rating, setRating] = useState(3);
  const [saving, setSaving] = useState(false);
  const [logged, setLogged] = useState(false);
  const [error, setError] = useState("");

  async function endSession() {
    setSummarizing(true);
    setError("");
    try {
      const res = await fetch("/api/ai/english-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "no_api_key" ? ai.errorNoKey : ai.errorGeneric);
        setSummarizing(false);
        return;
      }
      setSummary(data);
      setRating(data.self_rating || 3);
    } catch {
      setError(ai.errorGeneric);
    }
    setSummarizing(false);
  }

  async function confirmLog() {
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase.from("english_sessions").insert({
      user_id: userId,
      topic: summary.topic,
      vocabulary: summary.vocabulary,
      mistakes: summary.mistakes,
      self_rating: rating,
    });
    setSaving(false);
    if (saveError) {
      setError(ai.errorGeneric);
      return;
    }
    setLogged(true);
    setSummary(null);
  }

  if (logged) {
    return <p className="text-sm text-dusk">{ai.logged}</p>;
  }

  if (!summary) {
    return (
      <div>
        <button
          onClick={endSession}
          disabled={summarizing}
          className="flex items-center gap-2 text-sm rounded-soft border border-black/10 dark:border-white/10
                     px-3 py-2 text-ink-muted dark:text-moon-muted hover:border-sage hover:text-ink dark:hover:text-moon transition disabled:opacity-50"
        >
          <GraduationCap size={15} strokeWidth={2} />
          {summarizing ? ai.summarizing : ai.endSession}
        </button>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-1.5">
        <Sparkles size={14} strokeWidth={2} className="text-sage dark:text-sage-soft" /> {en.sessionSummary}
      </h3>

      <p className="text-sm"><span className="text-ink-muted dark:text-moon-muted">{en.topic}:</span> {summary.topic}</p>

      {summary.vocabulary.length > 0 && (
        <div>
          <p className="text-xs text-ink-muted dark:text-moon-muted mb-1">{en.newVocabulary}</p>
          <ul className="text-sm space-y-0.5">
            {summary.vocabulary.map((v, i) => (
              <li key={i}>• <strong>{v.word}</strong> — {v.meaning}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs text-ink-muted dark:text-moon-muted mb-1">{en.mistakesCorrected}</p>
        {summary.mistakes.length === 0 ? (
          <p className="text-sm">{en.noMistakes}</p>
        ) : (
          <ul className="text-sm space-y-0.5">
            {summary.mistakes.map((m, i) => (
              <li key={i}>• <span className="line-through text-ink-muted dark:text-moon-muted">{m.mistake}</span> → {m.correction}</li>
            ))}
          </ul>
        )}
      </div>

      {summary.encouragement && (
        <p className="text-sm italic text-ink-muted dark:text-moon-muted">{summary.encouragement}</p>
      )}

      <div className="flex items-center gap-2">
        <label className="text-xs text-ink-muted dark:text-moon-muted">{en.rating}</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-sm outline-none focus:border-sage"
        >
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
        </select>
      </div>

      <button
        onClick={confirmLog}
        disabled={saving}
        className="rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50"
      >
        {saving ? ai.saving : ai.confirmLog}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
