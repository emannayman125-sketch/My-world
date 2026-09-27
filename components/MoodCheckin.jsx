"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const MOOD_KEYS = ["good", "okay", "tired", "energized", "rough"];
const MOOD_EMOJI = { good: "🙂", okay: "😐", tired: "😴", energized: "🔥", rough: "😔" };

export default function MoodCheckin({ userId, initialMood, strings }) {
  const tr = strings.dashboard.mood;
  const supabase = createClient();
  const [mood, setMood] = useState(initialMood || null);

  async function selectMood(key) {
    setMood(key);
    await supabase
      .from("daily_moods")
      .upsert(
        { user_id: userId, mood_date: new Date().toISOString().slice(0, 10), mood: key },
        { onConflict: "user_id,mood_date" }
      );
  }

  if (mood) {
    return (
      <div className="card p-4 flex items-center gap-3">
        <span className="text-2xl">{MOOD_EMOJI[mood]}</span>
        <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.reflections[mood]}</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <p className="text-sm mb-3">{tr.question}</p>
      <div className="flex flex-wrap gap-2">
        {MOOD_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => selectMood(key)}
            className="rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-1.5 text-sm transition"
          >
            {MOOD_EMOJI[key]} {tr.options[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
