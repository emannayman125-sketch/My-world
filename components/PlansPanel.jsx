"use client";

import { useState } from "react";
import { Check, Trash2, Plus, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { PERIODS, plansInPeriod, planFraction, stats } from "@/lib/planRanges";

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
    stepPh: "أضف خطوة تحت الخطة دي (أو الصقي كذا سطر)",
    stepsHint: "قسّمي الخطة الكبيرة لخطوات صغيرة — النسبة بتتحسب منها.",
    noTable: "لازم تشغّلي ملف SQL رقم 021 في Supabase الأول.",
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
    stepPh: "Add a step under this plan (or paste several lines)",
    stepsHint: "Break a big plan into small steps — progress follows them.",
    noTable: "Run SQL file 021 in Supabase first.",
  },
};

// Plans for the day, week, month or year. Each plan is a row in the
// existing `goals` table (period = daily | weekly | monthly | yearly,
// progress 100 = done), so the progress charts can read them back.
export default function PlansPanel({ userId, initialPlans = [], initialSteps = [], locale = "ar" }) {
  const supabase = createClient();
  const T = L[locale] || L.ar;
  const [plans, setPlans] = useState(initialPlans);
  const [steps, setSteps] = useState(initialSteps);
  const [open, setOpen] = useState({});
  const [stepText, setStepText] = useState({});
  const [stepError, setStepError] = useState(false);
  const [period, setPeriod] = useState("daily");
  const [text, setText] = useState("");
  const [error, setError] = useState(false);

  const list = plansInPeriod(plans, period);
  const s = stats(list, steps);

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

  const stepsOf = (g, all = steps) => all.filter((x) => x.goal_id === g.id);

  async function syncProgress(g, nextSteps) {
    const mine = stepsOf(g, nextSteps);
    if (!mine.length) return;
    const next = mine.every((x) => x.is_done) ? 100 : 0;
    if ((g.progress || 0) === next) return;
    setPlans((p) => p.map((x) => (x.id === g.id ? { ...x, progress: next } : x)));
    await supabase.from("goals").update({ progress: next }).eq("id", g.id);
  }

  async function addSteps(g, e) {
    e.preventDefault();
    const lines = (stepText[g.id] || "").split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setStepError(false);
    const base = stepsOf(g).length;
    const rows = lines.map((title, i) => ({ user_id: userId, goal_id: g.id, title, position: base + i }));
    const { data, error: err } = await supabase.from("plan_steps").insert(rows).select();
    if (err || !data) return setStepError(true);
    const next = [...steps, ...data];
    setSteps(next);
    setStepText((t) => ({ ...t, [g.id]: "" }));
    syncProgress(g, next);
  }

  async function toggleStep(g, st) {
    const next = steps.map((x) => (x.id === st.id ? { ...x, is_done: !x.is_done } : x));
    setSteps(next);
    const { error: err } = await supabase.from("plan_steps").update({ is_done: !st.is_done }).eq("id", st.id);
    if (err) {
      setSteps(steps);
      return setStepError(true);
    }
    syncProgress(g, next);
  }

  async function removeStep(g, st) {
    const next = steps.filter((x) => x.id !== st.id);
    setSteps(next);
    const { error: err } = await supabase.from("plan_steps").delete().eq("id", st.id);
    if (err) {
      setSteps(steps);
      return setStepError(true);
    }
    syncProgress(g, next);
  }

  async function toggle(g) {
    const mine = stepsOf(g);
    if (mine.length) {
      // ticking a plan that has steps ticks (or clears) all of them
      const target = !mine.every((x) => x.is_done);
      const next = steps.map((x) => (x.goal_id === g.id ? { ...x, is_done: target } : x));
      setSteps(next);
      const { error: err } = await supabase.from("plan_steps").update({ is_done: target }).eq("goal_id", g.id);
      if (err) {
        setSteps(steps);
        return setStepError(true);
      }
      syncProgress(g, next);
      return;
    }
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
            const mine = stepsOf(g);
            const frac = planFraction(g, steps);
            const done = frac >= 1;
            const isOpen = !!open[g.id];
            return (
              <li key={g.id} className="py-2.5">
              <div className="flex items-center gap-3">
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
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                  aria-expanded={isOpen}
                  className="flex-1 min-w-0 flex items-center gap-2 text-start"
                >
                  <span className={`break-words ${done ? "line-through text-ink-muted dark:text-moon-muted" : ""}`}>
                    {g.title}
                  </span>
                  {mine.length > 0 && (
                    <span className="shrink-0 rounded-full bg-lantern/15 text-lantern-deep dark:text-lantern-soft text-[11px] px-2 py-0.5 tabular-nums">
                      {mine.filter((x) => x.is_done).length}/{mine.length}
                    </span>
                  )}
                  <ChevronDown size={15} className={`shrink-0 text-ink-muted dark:text-moon-muted transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(g)}
                  aria-label={T.del}
                  title={T.del}
                  className="p-1.5 rounded-full text-ink-muted dark:text-moon-muted hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {mine.length > 0 && (
                <div className="mt-2 ms-10 h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                  <div className="h-full rounded-full bg-gilded transition-all duration-300" style={{ width: `${Math.round(frac * 100)}%` }} />
                </div>
              )}

              {isOpen && (
                <div className="mt-2 ms-10 space-y-1.5">
                  {mine.length === 0 && (
                    <p className="text-xs text-ink-muted dark:text-moon-muted">{T.stepsHint}</p>
                  )}
                  {mine.map((st) => (
                    <div key={st.id} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={st.is_done}
                        onClick={() => toggleStep(g, st)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.6px] transition ${
                          st.is_done ? "bg-lantern border-lantern text-night" : "border-ink-muted/60 dark:border-moon-muted/60 text-transparent"
                        }`}
                      >
                        <Check size={12} strokeWidth={2.8} />
                      </button>
                      <span className={`flex-1 min-w-0 break-words text-sm ${st.is_done ? "line-through text-ink-muted dark:text-moon-muted" : ""}`}>
                        {st.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStep(g, st)}
                        aria-label={T.del}
                        className="p-1 rounded-full text-ink-muted dark:text-moon-muted hover:text-red-500 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <form onSubmit={(e) => addSteps(g, e)} className="flex gap-2 pt-1">
                    <textarea
                      rows={1}
                      value={stepText[g.id] || ""}
                      onChange={(e) => setStepText((t) => ({ ...t, [g.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addSteps(g, e);
                        }
                      }}
                      placeholder={T.stepPh}
                      aria-label={T.stepPh}
                      className="flex-1 min-w-0 resize-none rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-lantern"
                    />
                    <button type="submit" className="inline-flex items-center rounded-soft bg-lantern/90 text-night text-sm font-medium px-3 hover:brightness-105 transition">
                      <Plus size={14} />
                    </button>
                  </form>
                </div>
              )}
              </li>
            );
          })}
        </ul>
      )}
      {(error || stepError) && <p className="mt-2 text-xs text-red-500">{stepError ? T.noTable : T.err}</p>}
    </section>
  );
}
