"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const L = {
  ar: {
    title: "أهداف الأسبوع",
    hint: "٣ حاجات بس — اكتبي واتركي، بيتحفظ لوحده",
    ph: (n) => `هدف ${n}`,
    done: "من الأهداف اتحققت",
    err: "حصلت مشكلة في الحفظ",
  },
  en: {
    title: "This week's goals",
    hint: "Just three — type and move on, it saves itself",
    ph: (n) => `Goal ${n}`,
    done: "goals done",
    err: "Couldn't save",
  },
};

// Three ruled lines, a check box each. Typing saves when you leave the
// line; ticking saves at once. Stored in the existing `goals` table as
// weekly goals (progress 100 = done), so they also show up in Growth.
export default function WeekGoals({ userId, initialGoals = [], locale = "ar" }) {
  const supabase = createClient();
  const T = L[locale] || L.ar;
  const [rows, setRows] = useState(() =>
    [0, 1, 2].map((i) => {
      const g = initialGoals[i];
      return g ? { id: g.id, title: g.title, done: (g.progress || 0) >= 100 } : { id: null, title: "", done: false };
    })
  );
  const [error, setError] = useState(false);

  function patch(i, p) {
    setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));
  }

  async function saveTitle(i) {
    const row = rows[i];
    const title = row.title.trim();
    setError(false);
    if (row.id) {
      if (!title) {
        // an emptied line removes its goal
        const { error: e } = await supabase.from("goals").delete().eq("id", row.id);
        if (e) return setError(true);
        patch(i, { id: null, title: "", done: false });
        return;
      }
      const { error: e } = await supabase.from("goals").update({ title }).eq("id", row.id);
      if (e) setError(true);
    } else if (title) {
      const { data, error: e } = await supabase
        .from("goals")
        .insert({ user_id: userId, title, period: "weekly", progress: 0 })
        .select()
        .single();
      if (e || !data) return setError(true);
      patch(i, { id: data.id });
    }
  }

  async function toggle(i) {
    const row = rows[i];
    if (!row.id) return;
    const next = !row.done;
    patch(i, { done: next });
    const { error: e } = await supabase.from("goals").update({ progress: next ? 100 : 0 }).eq("id", row.id);
    if (e) {
      patch(i, { done: !next });
      setError(true);
    }
  }

  const filled = rows.filter((r) => r.id).length;
  const doneCount = rows.filter((r) => r.id && r.done).length;
  const pct = filled ? Math.round((doneCount / filled) * 100) : 0;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">{T.title}</h2>
        <span className="text-xs text-ink-muted dark:text-moon-muted tabular-nums">
          {doneCount}/{filled || 3} {T.done}
        </span>
      </div>
      <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{T.hint}</p>

      <div className="mt-3 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        <div className="h-full rounded-full bg-gilded transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-2 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={r.done}
              aria-label={T.ph(i + 1)}
              disabled={!r.id}
              onClick={() => toggle(i)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.8px] transition
                ${r.done ? "bg-lantern border-lantern text-night" : "border-ink-muted/60 dark:border-moon-muted/60 text-transparent"}
                disabled:opacity-35 disabled:cursor-default`}
            >
              <Check size={15} strokeWidth={2.6} />
            </button>
            <input
              value={r.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              onBlur={() => saveTitle(i)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              placeholder={T.ph(i + 1)}
              aria-label={T.ph(i + 1)}
              className={`flex-1 min-w-0 bg-transparent py-1.5 text-base outline-none border-b border-dashed
                border-black/15 dark:border-white/20 focus:border-lantern placeholder:text-ink-muted/60 dark:placeholder:text-moon-muted/60
                ${r.done ? "line-through text-ink-muted dark:text-moon-muted" : ""}`}
            />
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-xs text-red-500">{T.err}</p>}
    </section>
  );
}
