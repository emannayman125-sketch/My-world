"use client";

import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";

export default function SuggestionsInbox({ initialItems, strings: s }) {
  const [items, setItems] = useState(initialItems || []);
  const [busyId, setBusyId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  async function act(item, action) {
    setBusyId(item.id);
    setErrorId(null);
    try {
      const res = await fetch("/api/suggestions/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action }),
      });
      if (!res.ok) throw new Error("failed");
      setItems((list) => list.filter((i) => i.id !== item.id));
    } catch {
      setErrorId(item.id);
    }
    setBusyId(null);
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Sparkles size={22} className="mx-auto text-dusk/40 mb-2" />
        <p className="text-sm text-ink-muted dark:text-moon-muted">{s.empty}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="card p-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-dusk dark:text-dusk-soft mb-0.5">{s.source[item.source] || item.source}</p>
            <p className="text-sm font-medium">{item.title}</p>
            {item.subtitle && <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{item.subtitle}</p>}
            {errorId === item.id && <p className="text-xs text-red-500 mt-1">⚠</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => act(item, "accept")}
              disabled={busyId === item.id}
              className="inline-flex items-center gap-1 rounded-full bg-sage/15 text-sage dark:text-sage-soft text-xs px-3 py-1.5 hover:bg-sage/25 transition disabled:opacity-40"
            >
              <Check size={13} /> {s.accept}
            </button>
            <button
              onClick={() => act(item, "dismiss")}
              disabled={busyId === item.id}
              aria-label={s.dismiss}
              className="p-1.5 rounded-full text-ink-muted dark:text-moon-muted hover:bg-black/5 dark:hover:bg-white/10 transition disabled:opacity-40"
            >
              <X size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
