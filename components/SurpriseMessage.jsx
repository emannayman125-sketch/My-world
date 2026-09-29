"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { todayISO } from "@/lib/time";

export default function SurpriseMessage({ message, strings }) {
  const tr = strings.dashboard.surprise;
  const supabase = createClient();
  const [visible, setVisible] = useState(true);

  async function dismiss() {
    await supabase.from("hidden_messages").update({ is_delivered: true }).eq("id", message.id);
    // Lets the server hold back "anytime" messages for the rest of today.
    document.cookie = `surprise_day=${todayISO()}; path=/; max-age=172800`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="card p-6 border-sage/40 bg-sage/10 relative">
      <button
        onClick={dismiss}
        aria-label={tr.close}
        className="absolute end-4 top-4 text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
      >
        ×
      </button>
      <p className="text-xs text-sage dark:text-sage-soft mb-2">{tr.label}</p>
      <p className="leading-8 whitespace-pre-wrap pe-6">{message.content}</p>
    </div>
  );
}
