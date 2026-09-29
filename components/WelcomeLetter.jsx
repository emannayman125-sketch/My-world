"use client";

import { useEffect, useRef, useState } from "react";
import EnterWorldButton from "./EnterWorldButton";

// The birthday letter, exactly as written. It appears one stanza at a time,
// paced to reading speed, so it feels like being spoken to rather than
// dumped on a page. "Skip ahead" and reduced-motion both reveal it at once.
const STANZAS = [
  ["I made this little place for you."],
  [
    "Not because you need to become more productive...",
    "but because I want you to have a place that feels like you.",
  ],
  [
    "A place where you can put the things that are on your mind,",
    "the things you're working toward,",
    "the things you're learning,",
    "the ideas you don't want to lose,",
    "the memories you want to keep,",
    "and all the little things that make your world yours.",
  ],
  ["You don't have to have everything figured out."],
  ["You don't have to be productive every day."],
  ["You don't have to finish everything."],
  [
    "This place is simply here to help you carry a little less in your head,",
    "make a little more room for what matters,",
    "and give you somewhere to come back to.",
  ],
  [
    "For your work.",
    "For your ideas.",
    "For your goals.",
    "For your growth.",
    "For your quiet moments.",
    "For the things you're building.",
    "And for the person you're becoming.",
  ],
  ["So take your time."],
  ["Explore.", "Make it yours.", "Change it.", "Fill it with your world."],
  ["And whenever life gets a little noisy,", "come back here."],
  ["I'll keep a little space for you."],
  ["Welcome to your world, Ahmed. 🤍"],
];

export default function WelcomeLetter({ userId, preview = false }) {
  const total = STANZAS.length;
  const [shown, setShown] = useState(0); // how many stanzas are visible
  const endRef = useRef(null);
  const done = shown >= total;

  // Reduced motion: no choreography, show the whole letter.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setShown(total);
  }, [total]);

  // Reveal the next stanza after a pause that scales with how much there is to read.
  useEffect(() => {
    if (shown >= total) return;
    const readChars = shown === 0 ? 0 : STANZAS[shown - 1].join(" ").length;
    const wait = shown === 0 ? 700 : Math.min(3200, 700 + readChars * 28);
    const id = setTimeout(() => setShown((s) => s + 1), wait);
    return () => clearTimeout(id);
  }, [shown, total]);

  // Keep the newest line comfortably in view on a phone.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [shown]);

  return (
    <div className="card rounded-full_card px-8 py-10 sm:px-14 sm:py-14 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage/15 text-2xl mb-8">
        💌
      </span>

      <div className="space-y-7 font-letter text-ink dark:text-moon" aria-live="polite">
        {STANZAS.slice(0, shown).map((lines, i) => {
          const isLast = i === total - 1;
          return (
            <p
              key={i}
              className={`animate-fade-up ${
                isLast
                  ? "text-2xl sm:text-3xl italic pt-4"
                  : "text-lg sm:text-xl leading-9"
              }`}
            >
              {lines.map((line, j) => (
                <span key={j}>
                  {line}
                  {j < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        })}
      </div>

      {done ? (
        <div className="animate-fade-up mt-10">
          <EnterWorldButton userId={userId} preview={preview} />
          <p className="font-letter italic text-sm text-ink-muted dark:text-moon-muted mt-8">— Eman</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShown(total)}
          className="mt-10 text-xs text-ink-muted dark:text-moon-muted underline underline-offset-4 hover:text-ink dark:hover:text-moon"
        >
          Skip ahead
        </button>
      )}

      <div ref={endRef} />
    </div>
  );
}
