"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

// On-demand only — Hamzawi reflects patterns from his OWN logged data back
// to him. Never advice, never predictions. He asks, Hamzawi answers once.
export default function TradingInsight({ locale, strings: s }) {
  const [state, setState] = useState("idle"); // idle | loading | ready | empty | error
  const [observations, setObservations] = useState([]);

  async function ask() {
    setState("loading");
    try {
      const res = await fetch("/api/ai/trading-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) { setState("error"); return; }
      if (!data.insight) { setState("empty"); return; }
      setObservations(data.insight);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  if (state === "idle") {
    return (
      <button
        onClick={ask}
        className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm text-violet-400"
      >
        <Sparkles size={14} /> {s.ask}
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-2">
      <p className="text-xs font-medium text-violet-400 flex items-center gap-1.5">
        <Sparkles size={13} /> {s.title}
      </p>
      {state === "loading" && <p className="text-sm text-ink-muted dark:text-moon-muted">{s.loading}</p>}
      {state === "empty" && <p className="text-sm text-ink-muted dark:text-moon-muted">{s.notEnough}</p>}
      {state === "error" && <p className="text-sm text-red-400">{s.error}</p>}
      {state === "ready" && (
        <ul className="space-y-1.5">
          {observations.map((o, i) => (
            <li key={i} className="text-sm leading-6">· {o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
