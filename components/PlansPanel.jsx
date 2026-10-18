"use client";

import { useState } from "react";
import { Check, Trash2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { PERIODS, plansInPeriod, stats } from "@/lib/planRanges";

const L = {
  ar: {
    title: "خططي",
    periods: { daily: "يومية", weekly: "أسبوعية", monthly: "شهرية", yearly: "سنوية" },
    ph: {
      daily: "إيه خطتك النهاردة؟",
      weekly: "إيه هدفك للأسبوع ده؟",
      monthly: "إيه هدفك للشهر ده؟",
      yearly: "إيه هدفك للسنة دي؟",
    },
    add: "إضافة",
    empty: "لسه مفيش خطة هنا. اكتبي أول واحدة فوق.",
    done: "اتحققت",
    err: "حصلت مشكلة، جرّب تاني.",
    del: "حذف",
  },
  en: {
    title: "My plans",
    periods: { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" },
    ph: {
      daily: "What's today's plan?",
      weekly: "What's your goal this week?",
      monthly: "What's your goal this month?",
      yearly: "What's your goal this year?",
    },
    add: "Add",
    empty: "No plan here yet. Write your first one above.",
    done: "done",
    err: "Something went wrong. Try again.",
    del: "Delete",
  },
};

// Plans for the day, week, month or year. Each plan is a row in the
// existing `goals` table (period = daily | weekly | monthly | yearly,
// progress 100 = done), so the progress charts can read them back.
export default function PlansPanel({ userId, initialPlans = [], locale = "ar" }) {
  const supabase = createClient();
  const T = L[locale] || L.ar;
  const [plans, setPlans] = useState(initialPlans);
  const [period, setPeriod] = useState("daily");
  const [text, setText] = useState("");
  const [error, setError] = useState(false);

  const list = plansInPeriod(plans, period);
  const s = stats(list);

  async function add(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setError(false);
    const { data, error: err } = await supabase
      .from("goals")
      .insert({ user_id: userId, title, period, progress: 0 })
      .select()
      .single();
    if (err || !data) return setError(true);
    setPlans((p) => [...p, data]);
    setText("");
  }

  async function toggle(g) {
    const next = (g.progress || 0) >= 100 ? 0 : 100;
    setPlans((p) => p.map((x) => (x.id === g.id ? { ...x, progress: next } : x)));
    const { error: err } = await supabase.from("goals").update({ progress: next }).eq("id", g.id);
    if (err) {
      setPlans((p) => p.map((x) => (x.id === g.id ? { ...x, progress: g.progress } : x)));
      setError(true);
    }
  }

  async function remove(g) {
    const prev = plans;
    setPlans((p) => p.filter((x) => x.id !== g.id));
    const { error: err } = await supabase.from("goals").delete().eq("id", g.id);
    if (err) {
      setPlans(prev);
      setError(true);
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl">{T.title}</h2>
        <span className="text-xs text-ink-muted dark:text-moon-muted tabular-nums">
          {s.done}/{s.total} {T.done} · {s.pct}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              period === p
                ? "bg-lantern text-night font-medium"
                : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
            }`}
          >
            {T.periods[p]}
          </button>
        ))}
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        <div className="h-full rounded-full bg-gilded transition-all duration-300" style={{ width: `${s.pct}%` }} />
      </div>

      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={T.ph[period]}
          aria-label={T.ph[period]}
          className="flex-1 min-w-0 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2 hover:brightness-105 transition"
        >
          <Plus size={14} /> {T.add}
        </button>
      </form>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted dark:text-moon-muted">{T.empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
          {list.map((g) => {
            const done = (g.progress || 0) >= 100;
            return (
              <li key={g.id} className="flex items-center gap-3 py-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  onClick={() => toggle(g)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.8px] transition ${
                    done ? "bg-lantern border-lantern text-night" : "border-ink-muted/60 dark:border-moon-muted/60 text-transparent"
                  }`}
                >
                  <Check size={15} strokeWidth={2.6} />
                </button>
                <span className={`flex-1 min-w-0 break-words ${done ? "line-through text-ink-muted dark:text-moon-muted" : ""}`}>
                  {g.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(g)}
                  aria-label={T.del}
                  title={T.del}
                  className="p-1.5 rounded-full text-ink-muted dark:text-moon-muted hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{T.err}</p>}
    </section>
  );
}
