"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { ArrowUp, ArrowDown } from "lucide-react";

// Simple, reliable reordering — up/down buttons rather than drag-and-drop,
// so it works the same on touch and mouse with zero added dependencies.
export default function SectionOrderManager({ userId, initialOrder, strings: s }) {
  const supabase = createClient();
  const [order, setOrder] = useState(initialOrder);
  const [saving, setSaving] = useState(false);

  async function persist(next) {
    setOrder(next);
    setSaving(true);
    await supabase.from("profiles").update({ public_section_order: next }).eq("id", userId);
    setSaving(false);
  }

  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  return (
    <div className="space-y-1.5">
      {order.map((key, i) => (
        <div key={key} className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-sm">{s.sections[key] || key}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0 || saving}
              aria-label={s.moveUp}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted dark:text-moon-muted hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 transition"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === order.length - 1 || saving}
              aria-label={s.moveDown}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-muted dark:text-moon-muted hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-25 transition"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
