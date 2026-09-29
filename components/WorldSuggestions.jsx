"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Sparkles, Plus, Check, RefreshCw } from "lucide-react";

const KIND_EMOJI = { music: "🎵", movie: "🎬", podcast: "🎙️", book: "📚", place: "✈️", hobby: "🎮" };

// A quiet "Hamzawi suggests" card for the My World tab. Fetched on demand
// (tap to reveal), never automatically, since taste suggestions aren't a
// daily need and shouldn't spend an AI call on every visit.
export default function WorldSuggestions({ userId, locale, strings: w }) {
  const supabase = createClient();
  const [state, setState] = useState("idle"); // idle | loading | ready | empty | error
  const [suggestions, setSuggestions] = useState([]);
  const [added, setAdded] = useState([]);
  const [shown, setShown] = useState([]); // titles already offered, so a refresh doesn't repeat them

  async function load(excludeShown) {
    setState("loading");
    try {
      const res = await fetch("/api/ai/world-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, exclude: excludeShown ? shown : [] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        return;
      }
      if (data.reason === "no_taste_data" || data.suggestions.length === 0) {
        setState("empty");
        return;
      }
      setSuggestions(data.suggestions);
      setShown((prev) => [...prev, ...data.suggestions.map((s) => s.title)]);
      setAdded([]);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  async function addSuggestion(s) {
    const statusKey = w.defaultStatus[s.kind];
    const { error } = await supabase.from("world_items").insert({
      user_id: userId,
      kind: s.kind,
      status: statusKey,
      title: s.title,
      subtitle: s.subtitle || null,
      is_public: false,
    });
    if (!error) setAdded((list) => [...list, s.title]);
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => load(false)}
        className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm text-dusk dark:text-dusk-soft"
      >
        <Sparkles size={15} strokeWidth={2} />
        {w.askHamzawi}
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2 text-dusk dark:text-dusk-soft">
          <Sparkles size={15} /> {w.suggestionsTitle}
        </p>
        {state === "ready" && (
          <button
            onClick={() => load(true)}
            className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon flex items-center gap-1"
          >
            <RefreshCw size={12} /> {w.more}
          </button>
        )}
      </div>

      {state === "loading" && (
        <div className="space-y-2" aria-busy="true">
          <div className="h-10 rounded-soft bg-dusk/10 animate-pulse" />
          <div className="h-10 rounded-soft bg-dusk/10 animate-pulse" />
        </div>
      )}

      {state === "empty" && <p className="text-sm text-ink-muted dark:text-moon-muted">{w.emptyHint}</p>}
      {state === "error" && <p className="text-sm text-red-500">{w.error}</p>}

      {state === "ready" && (
        <ul className="space-y-2">
          {suggestions.map((s, i) => {
            const isAdded = added.includes(s.title);
            return (
              <li key={i} className="flex items-start gap-3 rounded-soft bg-paper-card dark:bg-night-card border border-hairline dark:border-hairline-dark px-3 py-2.5">
                <span className="text-lg leading-none mt-0.5">{KIND_EMOJI[s.kind]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.title}</p>
                  {s.subtitle && <p className="text-xs text-ink-muted dark:text-moon-muted">{s.subtitle}</p>}
                  {s.reason && <p className="text-xs text-dusk dark:text-dusk-soft mt-0.5 italic">{s.reason}</p>}
                </div>
                {isAdded ? (
                  <span className="flex items-center gap-1 text-xs text-sage dark:text-sage-soft shrink-0 mt-0.5">
                    <Check size={13} /> {w.added}
                  </span>
                ) : (
                  <button
                    onClick={() => addSuggestion(s)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-dusk/30 px-2.5 py-1 text-xs text-dusk dark:text-dusk-soft hover:bg-dusk/10 transition mt-0.5"
                  >
                    <Plus size={12} /> {w.add}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
