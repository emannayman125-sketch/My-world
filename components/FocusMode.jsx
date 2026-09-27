"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "./Confetti";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const TEXT = {
  ar: {
    close: "× إغلاق",
    presetCustom: "مخصّص",
    focusMode: "Focus Mode",
    focusLabel: "تركيز",
    restLabel: "/ راحة",
    minuteLabel: "دقيقة",
    finish: "🎯 Finish",
    pause: "وقف مؤقتًا",
    resume: "استكمل",
    restPhase: "☕ استراحة",
    skipRest: "تخطي الاستراحة",
    doneTitle: "Done. One thing less. ❤️",
    doneBody: (title) => `خلصت جولة تركيز على "${title}"`,
    takeRest: (min) => `خد استراحة ${min} د`,
    markDone: "علّم المهمة خلصت",
    exit: "خروج",
  },
  en: {
    close: "× Close",
    presetCustom: "Custom",
    focusMode: "Focus Mode",
    focusLabel: "Focus",
    restLabel: "/ Rest",
    minuteLabel: "min",
    finish: "🎯 Finish",
    pause: "Pause",
    resume: "Resume",
    restPhase: "☕ Break",
    skipRest: "Skip break",
    doneTitle: "Done. One thing less. ❤️",
    doneBody: (title) => `Finished a focus round on "${title}"`,
    takeRest: (min) => `Take a ${min} min break`,
    markDone: "Mark task done",
    exit: "Exit",
  },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusMode({ taskTitle, onClose, onTaskDone }) {
  const locale = getClientLocale();
  const tx = TEXT[locale] || TEXT.en;
  const PRESETS = [
    { key: "25-5", label: "25 / 5", focus: 25, rest: 5 },
    { key: "50-10", label: "50 / 10", focus: 50, rest: 10 },
    { key: "custom", label: tx.presetCustom, focus: 25, rest: 5 },
  ];

  const [preset, setPreset] = useState(null);
  const [customFocus, setCustomFocus] = useState(25);
  const [customRest, setCustomRest] = useState(5);
  const [phase, setPhase] = useState("setup"); // setup | focus | rest | done
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (phase === "focus") {
            setPhase("done");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  function startFocus(chosenPreset) {
    const focusMin = chosenPreset.key === "custom" ? customFocus : chosenPreset.focus;
    setPreset({ ...chosenPreset, focus: focusMin, rest: chosenPreset.key === "custom" ? customRest : chosenPreset.rest });
    setSecondsLeft(focusMin * 60);
    setPhase("focus");
    setRunning(true);
  }

  function startRest() {
    setSecondsLeft(preset.rest * 60);
    setPhase("rest");
    setRunning(true);
  }

  function skipRest() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase("setup");
    setPreset(null);
  }

  return (
    <div className="fixed inset-0 z-[120] bg-night flex items-center justify-center px-6 aurora-bg">
      {phase === "done" && <Confetti onDone={() => {}} />}

      <button
        onClick={onClose}
        className="absolute top-6 start-6 text-moon-muted hover:text-moon text-sm"
      >
        {tx.close}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm w-full"
      >
        {phase === "setup" && (
          <>
            <p className="text-moon-muted mb-2">{tx.focusMode}</p>
            <h1 className="font-display text-2xl text-moon mb-8">🎯 {taskTitle}</h1>
            <div className="space-y-3">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => startFocus(p)}
                  className="w-full rounded-soft bg-white/10 hover:bg-white/15 text-moon py-3 transition"
                >
                  {p.label}
                </button>
              ))}
              {PRESETS.some((p) => p.key === "custom") && (
                <div className="flex items-center gap-2 justify-center text-moon-muted text-sm pt-2">
                  <span>{tx.focusLabel}</span>
                  <input
                    type="number"
                    value={customFocus}
                    onChange={(e) => setCustomFocus(Number(e.target.value))}
                    className="w-14 rounded-soft bg-white/10 text-center py-1 outline-none"
                  />
                  <span>{tx.restLabel}</span>
                  <input
                    type="number"
                    value={customRest}
                    onChange={(e) => setCustomRest(Number(e.target.value))}
                    className="w-14 rounded-soft bg-white/10 text-center py-1 outline-none"
                  />
                  <span>{tx.minuteLabel}</span>
                </div>
              )}
            </div>
          </>
        )}

        {phase === "focus" && (
          <>
            <p className="text-moon-muted mb-2">{tx.finish}</p>
            <h1 className="font-display text-2xl text-moon mb-8">{taskTitle}</h1>
            <p className="font-display text-7xl text-moon mb-8 tabular-nums">{formatTime(secondsLeft)}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setRunning((r) => !r)}
                className="rounded-soft bg-lantern text-night px-6 py-3 font-medium hover:brightness-105"
              >
                {running ? tx.pause : tx.resume}
              </button>
            </div>
          </>
        )}

        {phase === "rest" && (
          <>
            <p className="text-moon-muted mb-2">{tx.restPhase}</p>
            <p className="font-display text-7xl text-moon mb-8 tabular-nums">{formatTime(secondsLeft)}</p>
            <button onClick={skipRest} className="text-moon-muted hover:text-moon text-sm underline">
              {tx.skipRest}
            </button>
          </>
        )}

        {phase === "done" && (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h1 className="font-display text-2xl text-moon mb-2">{tx.doneTitle}</h1>
            <p className="text-moon-muted mb-8">{tx.doneBody(taskTitle)}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={startRest}
                className="rounded-soft bg-white/10 text-moon px-5 py-3 hover:bg-white/15"
              >
                {tx.takeRest(preset?.rest)}
              </button>
              {onTaskDone && (
                <button
                  onClick={() => { onTaskDone(); onClose(); }}
                  className="rounded-soft bg-lantern text-night px-5 py-3 font-medium hover:brightness-105"
                >
                  {tx.markDone}
                </button>
              )}
              <button onClick={onClose} className="rounded-soft bg-white/10 text-moon px-5 py-3 hover:bg-white/15">
                {tx.exit}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
