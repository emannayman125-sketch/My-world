"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

// A quiet bell in the header: how many of Hamzawi's suggestions are still
// waiting on a decision, across the whole app. Zero shows nothing at all.
export default function SuggestionsBadge({ userId, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("ai_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .then(({ count }) => {
        if (!cancelled) setCount(count || 0);
      });
    return () => { cancelled = true; };
  }, [userId]);

  if (count === 0) return null;

  return (
    <Link
      href="/suggestions"
      aria-label={label}
      className="relative w-9 h-9 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
    >
      <Sparkles size={17} strokeWidth={2} className="text-dusk dark:text-dusk-soft" />
      <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-dusk text-white text-[10px] leading-4 text-center font-medium">
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}
