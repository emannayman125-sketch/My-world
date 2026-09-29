"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, Volume2, Square, Plus, Check } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useVoice } from "@/lib/useVoice";
import { todayISO } from "@/lib/time";

// Hamzawi's daily brief. It SUGGESTS; nothing is added unless Ahmed taps "+".
export default function DailyBrief({ locale, strings, top3Titles = [], top3Count = 0 }) {
  const b = strings;
  const router = useRouter();
  const [state, setState] = useState("loading"); // loading | ready | error
  const [brief, setBrief] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [added, setAdded] = useState([]);
  const [addError, setAddError] = useState(false);
  const voice = useVoice({ locale });

  async function load(refresh = false) {
    try {
      const res = await fetch(`/api/ai/daily-brief?locale=${locale}${refresh ? "&refresh=1" : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setBrief(data.brief);
      setState("ready");
    } catch {
      setState((s) => (s === "ready" ? s : "error"));
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setRefreshing(true);
    voice.stopSpeaking();
    setAdded([]);
    await load(true);
    setRefreshing(false);
  }

  const slotsLeft = 3 - top3Count - added.length;

  async function addToToday(item) {
    setAddError(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("top3_tasks")
      .insert({ user_id: user.id, title: item.title, for_date: todayISO() });
    if (error) {
      setAddError(true);
      return;
    }
    setAdded((list) => [...list, item.title]);
    router.refresh();
  }

  function toggleSpeak() {
    if (voice.speaking) {
      voice.stopSpeaking();
      return;
    }
    const parts = [brief.headline, ...brief.focus.map((f) => f.title), brief.note].filter(Boolean);
    voice.speak(parts.join(". "));
  }

  if (state === "error") return null; // the rest of Home works without it

  return (
    <section className="rounded-card border border-dusk/20 bg-dusk/[0.05] dark:bg-dusk/[0.10] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dusk/15 text-dusk dark:text-dusk-soft">
          <Sparkles size={16} strokeWidth={1.9} />
        </span>
        <p className="text-xs font-medium text-dusk dark:text-dusk-soft flex-1">{b.label}</p>
        {state === "ready" && voice.canSpeak && (
          <button
            type="button"
            onClick={toggleSpeak}
            aria-label={voice.speaking ? b.stopListening : b.listen}
            className="w-8 h-8 rounded-full flex items-center justify-center text-dusk dark:text-dusk-soft hover:bg-dusk/10 transition"
          >
            {voice.speaking ? <Square size={14} /> : <Volume2 size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing || state === "loading"}
          aria-label={b.refresh}
          className="w-8 h-8 rounded-full flex items-center justify-center text-dusk dark:text-dusk-soft hover:bg-dusk/10 transition disabled:opacity-40"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {state === "loading" && (
        <div className="space-y-2.5" aria-busy="true" aria-label={b.loading}>
          <div className="h-5 w-4/5 rounded bg-dusk/10 animate-pulse" />
          <div className="h-4 w-3/5 rounded bg-dusk/10 animate-pulse" />
          <div className="h-4 w-2/5 rounded bg-dusk/10 animate-pulse" />
        </div>
      )}

      {state === "ready" && brief && (
        <>
          <p className="font-display text-xl leading-snug">{brief.headline}</p>

          {brief.focus.length > 0 && (
            <ul className="space-y-2">
              {brief.focus.map((item, i) => {
                const already = top3Titles.includes(item.title) || added.includes(item.title);
                const canAdd = !already && slotsLeft > 0;
                return (
                  <li
                    key={`${item.title}-${i}`}
                    className="flex items-center gap-3 rounded-soft bg-paper-card dark:bg-night-card border border-hairline dark:border-hairline-dark px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{item.title}</p>
                      {item.why && (
                        <p className="text-xs text-ink-muted dark:text-moon-muted mt-0.5">{item.why}</p>
                      )}
                    </div>
                    {already ? (
                      <span className="flex items-center gap-1 text-xs text-sage dark:text-sage-soft shrink-0">
                        <Check size={14} /> {b.added}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToToday(item)}
                        disabled={!canAdd}
                        title={canAdd ? b.addToToday : b.full}
                        className="shrink-0 inline-flex items-center gap-1 rounded-full border border-dusk/30 px-3 py-1.5 text-xs text-dusk dark:text-dusk-soft hover:bg-dusk/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <Plus size={13} /> {b.addToToday}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {slotsLeft <= 0 && brief.focus.length > 0 && (
            <p className="text-xs text-ink-muted dark:text-moon-muted">{b.full}</p>
          )}
          {addError && <p className="text-xs text-red-500">{b.addError}</p>}

          {brief.note && <p className="text-sm text-ink-muted dark:text-moon-muted italic">{brief.note}</p>}

          <Link href="/ai" className="inline-block text-xs text-dusk dark:text-dusk-soft hover:underline">
            {b.talk}
          </Link>
        </>
      )}
    </section>
  );
}
