"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

// Shown on Home while the world is still empty. Never forced: "Later" hides it for good.
export default function OnboardingPrompt({ strings }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <section className="rounded-card border border-dusk/20 bg-dusk/[0.05] dark:bg-dusk/[0.10] p-5 space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dusk/15 text-dusk dark:text-dusk-soft shrink-0">
          <Sparkles size={17} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg leading-snug">{strings.title}</p>
          <p className="text-sm text-ink-muted dark:text-moon-muted">{strings.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/onboarding" className="rounded-soft bg-lantern text-lantern-ink text-sm font-medium px-5 py-2.5 shadow-lantern hover:brightness-105 transition">
          {strings.start}
        </Link>
        <button
          onClick={() => {
            document.cookie = "onboarding_done=1; path=/; max-age=31536000";
            setHidden(true);
          }}
          className="text-sm text-ink-muted dark:text-moon-muted hover:underline"
        >
          {strings.later}
        </button>
      </div>
    </section>
  );
}
