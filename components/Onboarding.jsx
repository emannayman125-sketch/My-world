"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mic, Square, Volume2, VolumeX, ArrowRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useVoice } from "@/lib/useVoice";

const KEYS = ["study", "week", "daily", "goals", "into"];

function setDoneCookie() {
  document.cookie = "onboarding_done=1; path=/; max-age=31536000";
}

// Used only if the AI is unavailable: a plain split of what he wrote.
function splitItems(text) {
  return String(text || "")
    .split(/[\n،,؛;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}
function fallbackProposal(answers) {
  return {
    tasks: splitItems(answers.week).map((title) => ({ title, priority: "normal", due_date: null })),
    habits: splitItems(answers.daily).map((name) => ({ name, emoji: "🔥" })),
    goals: splitItems(answers.goals).map((title) => ({ title, period: "monthly" })),
    currently: [],
  };
}

export default function Onboarding({ userId, name, locale, strings: s }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0); // 0..4 = questions
  const [phase, setPhase] = useState("ask"); // ask | thinking | review | saving
  const [answers, setAnswers] = useState({ study: "", week: "", daily: "", goals: "", into: "" });
  const [items, setItems] = useState(null); // { tasks, habits, goals, currently } each with `on`
  const [usedFallback, setUsedFallback] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);

  const keyRef = useRef(KEYS[0]);
  keyRef.current = KEYS[step];

  const voice = useVoice({
    locale,
    onFinalTranscript: (text) =>
      setAnswers((a) => ({ ...a, [keyRef.current]: (a[keyRef.current] ? a[keyRef.current].trimEnd() + " " : "") + text })),
  });

  const q = s.questions[step];
  const firstName = (name || "").trim().split(/\s+/)[0];
  const isLast = step === KEYS.length - 1;

  // Optionally read each question aloud.
  useEffect(() => {
    if (phase === "ask" && speakOn && voice.canSpeak) voice.speak(q.q);
    return () => voice.stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, speakOn, phase]);

  function leave() {
    setDoneCookie();
    router.push("/dashboard");
    router.refresh();
  }

  async function organize() {
    voice.stopListening();
    voice.stopSpeaking();
    setPhase("thinking");
    let proposal = null;
    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, locale }),
      });
      if (res.ok) proposal = await res.json();
    } catch {}
    if (!proposal) {
      proposal = fallbackProposal(answers);
      setUsedFallback(true);
    }
    const on = (arr) => arr.map((x) => ({ ...x, on: true }));
    setItems({
      tasks: on(proposal.tasks || []),
      habits: on(proposal.habits || []),
      goals: on(proposal.goals || []),
      currently: on(proposal.currently || []),
    });
    setPhase("review");
  }

  function update(group, i, patch) {
    setItems((cur) => ({ ...cur, [group]: cur[group].map((x, idx) => (idx === i ? { ...x, ...patch } : x)) }));
  }

  const chosen = items
    ? {
        tasks: items.tasks.filter((x) => x.on && x.title.trim()),
        habits: items.habits.filter((x) => x.on && x.name.trim()),
        goals: items.goals.filter((x) => x.on && x.title.trim()),
        currently: items.currently.filter((x) => x.on && x.title.trim()),
      }
    : null;
  const total = chosen ? chosen.tasks.length + chosen.habits.length + chosen.goals.length + chosen.currently.length : 0;

  async function save() {
    setPhase("saving");
    setSaveError(false);
    const jobs = [];
    if (chosen.tasks.length)
      jobs.push(supabase.from("tasks").insert(chosen.tasks.map((t) => ({ user_id: userId, title: t.title.trim(), priority: t.priority, due_date: t.due_date }))));
    if (chosen.habits.length)
      jobs.push(supabase.from("habits").insert(chosen.habits.map((h) => ({ user_id: userId, name: h.name.trim(), emoji: h.emoji }))));
    if (chosen.goals.length)
      jobs.push(supabase.from("goals").insert(chosen.goals.map((g) => ({ user_id: userId, title: g.title.trim(), period: g.period }))));
    if (chosen.currently.length)
      jobs.push(supabase.from("currently_items").insert(chosen.currently.map((c) => ({ user_id: userId, kind: c.kind, title: c.title.trim() }))));

    const results = await Promise.all(jobs);
    if (results.some((r) => r.error)) {
      setSaveError(true);
      setPhase("review");
      return;
    }
    leave();
  }

  const shell = "min-h-screen bg-paper dark:bg-night aurora-bg px-5 py-8 flex justify-center";

  // ---------- thinking ----------
  if (phase === "thinking" || phase === "saving") {
    return (
      <main className={shell}>
        <div className="w-full max-w-xl flex flex-col items-center justify-center text-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-dusk/15 text-dusk dark:text-dusk-soft animate-pulse">
            <Sparkles size={24} />
          </span>
          <p className="font-display text-2xl">{phase === "thinking" ? s.thinking : s.saving}</p>
        </div>
      </main>
    );
  }

  // ---------- review ----------
  if (phase === "review" && items) {
    const groups = [
      { key: "tasks", title: s.groups.tasks, render: (x, i) => (
        <input value={x.title} onChange={(e) => update("tasks", i, { title: e.target.value })} className="flex-1 min-w-0 bg-transparent outline-none text-sm" />
      ) },
      { key: "habits", title: s.groups.habits, render: (x, i) => (
        <span className="flex-1 min-w-0 flex items-center gap-2 text-sm">
          <span>{x.emoji}</span>
          <input value={x.name} onChange={(e) => update("habits", i, { name: e.target.value })} className="flex-1 min-w-0 bg-transparent outline-none" />
        </span>
      ) },
      { key: "goals", title: s.groups.goals, render: (x, i) => (
        <span className="flex-1 min-w-0 flex items-center gap-2 text-sm">
          <input value={x.title} onChange={(e) => update("goals", i, { title: e.target.value })} className="flex-1 min-w-0 bg-transparent outline-none" />
          <span className="shrink-0 text-xs text-ink-muted dark:text-moon-muted">{x.period === "weekly" ? s.weekly : s.monthly}</span>
        </span>
      ) },
      { key: "currently", title: s.groups.currently, render: (x, i) => (
        <span className="flex-1 min-w-0 flex items-center gap-2 text-sm">
          <span className="shrink-0 text-xs text-ink-muted dark:text-moon-muted">{s.kinds[x.kind]}</span>
          <input value={x.title} onChange={(e) => update("currently", i, { title: e.target.value })} className="flex-1 min-w-0 bg-transparent outline-none" />
        </span>
      ) },
    ].filter((g) => items[g.key].length > 0);

    return (
      <main className={shell}>
        <div className="w-full max-w-xl space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl leading-tight">{s.reviewTitle}</h1>
            <p className="text-sm text-ink-muted dark:text-moon-muted">{usedFallback ? s.fallbackNote : s.reviewHint}</p>
          </div>

          {groups.length === 0 && <div className="card p-5 text-sm text-ink-muted dark:text-moon-muted">{s.nothingFound}</div>}

          {groups.map((g) => (
            <section key={g.key} className="space-y-2">
              <p className="text-xs font-medium text-ink-muted dark:text-moon-muted">{g.title}</p>
              <ul className="space-y-2">
                {items[g.key].map((x, i) => (
                  <li key={i} className={`card px-4 py-3 flex items-center gap-3 transition ${x.on ? "" : "opacity-45"}`}>
                    <input
                      type="checkbox"
                      checked={x.on}
                      onChange={(e) => update(g.key, i, { on: e.target.checked })}
                      aria-label={s.keep}
                      className="h-4 w-4 accent-[#4F7A63] shrink-0"
                    />
                    {g.render(x, i)}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {saveError && <p className="text-sm text-red-500">{s.saveError}</p>}

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={total > 0 ? save : leave}
              className="rounded-soft bg-lantern text-lantern-ink font-medium px-6 py-3 shadow-lantern hover:brightness-105 transition"
            >
              {total > 0 ? s.saveN.replace("{n}", String(total)) : s.enter}
            </button>
            <button onClick={() => setPhase("ask")} className="text-sm text-ink-muted dark:text-moon-muted hover:underline">
              {s.backToQuestions}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---------- questions ----------
  return (
    <main className={shell}>
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" aria-label={s.progress.replace("{n}", String(step + 1)).replace("{total}", String(KEYS.length))}>
            {KEYS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-dusk" : i < step ? "w-3 bg-dusk/50" : "w-3 bg-black/10 dark:bg-white/15"}`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {voice.canSpeak && (
              <button
                onClick={() => setSpeakOn((v) => !v)}
                aria-pressed={speakOn}
                aria-label={s.speakToggle}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5"
              >
                {speakOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
            <button onClick={leave} className="text-sm text-ink-muted dark:text-moon-muted hover:underline">
              {s.skipAll}
            </button>
          </div>
        </div>

        {step === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">
            {(firstName ? s.introNamed.replace("{name}", firstName) : s.intro)}
          </p>
        )}

        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dusk/15 text-dusk dark:text-dusk-soft">
            <Sparkles size={17} />
          </span>
          <div className="rounded-card rounded-ss-md bg-dusk/[0.07] dark:bg-dusk/[0.14] px-5 py-4">
            <p className="font-display text-xl leading-snug">{q.q}</p>
            <p className="text-xs text-ink-muted dark:text-moon-muted mt-1.5">{q.hint}</p>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            value={voice.listening ? (answers[KEYS[step]] ? answers[KEYS[step]] + " " : "") + voice.interim : answers[KEYS[step]]}
            readOnly={voice.listening}
            onChange={(e) => setAnswers((a) => ({ ...a, [KEYS[step]]: e.target.value }))}
            rows={5}
            placeholder={voice.listening ? s.listening : q.placeholder}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-paper-card dark:bg-night-card px-4 py-3 text-sm outline-none focus:border-sage resize-none"
          />
          {voice.canListen && (
            <button
              type="button"
              onClick={voice.listening ? voice.stopListening : voice.startListening}
              aria-pressed={voice.listening}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                voice.listening ? "bg-dusk text-white animate-pulse" : "bg-dusk/12 text-dusk dark:text-dusk-soft hover:bg-dusk/20"
              }`}
            >
              {voice.listening ? <Square size={14} /> : <Mic size={14} />}
              {voice.listening ? s.stop : s.speak}
            </button>
          )}
          {voice.error === "not-allowed" && <p className="text-xs text-red-500">{s.micDenied}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setStep((n) => Math.max(0, n - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted dark:text-moon-muted disabled:opacity-30"
          >
            {locale === "ar" ? <ArrowRight size={15} /> : <ArrowLeft size={15} />} {s.back}
          </button>

          <div className="flex items-center gap-3">
            {!isLast && (
              <button onClick={() => setStep((n) => n + 1)} className="text-sm text-ink-muted dark:text-moon-muted hover:underline">
                {answers[KEYS[step]].trim() ? s.next : s.skipQuestion}
              </button>
            )}
            <button
              onClick={isLast ? organize : () => setStep((n) => n + 1)}
              disabled={isLast && !Object.values(answers).some((v) => v.trim())}
              className="rounded-soft bg-lantern text-lantern-ink font-medium px-5 py-2.5 shadow-lantern hover:brightness-105 transition disabled:opacity-40"
            >
              {isLast ? s.organize : s.next}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
