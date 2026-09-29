"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// The welcome letter is always in English by design — it's a fixed,
// personal moment, not tied to the site's language toggle.
export default function EnterWorldButton({ userId, preview = false }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleEnter() {
    setLoading(true);
    if (!preview) {
      await supabase
        .from("profiles")
        .update({ has_seen_welcome: true })
        .eq("id", userId);
    }
    // In preview we go on to the birthday celebration without touching any saved state.
    router.push(preview ? "/dashboard?previewBirthday=1" : "/dashboard");
    router.refresh();
  }

  return (
    <button
      onClick={handleEnter}
      disabled={loading}
      className="rounded-soft bg-lantern text-night font-medium px-8 py-3
                 shadow-lantern hover:brightness-105 transition disabled:opacity-60"
    >
      {loading ? "One moment..." : "Enter your world"}
    </button>
  );
}
