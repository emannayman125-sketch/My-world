"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "./ToastProvider";

// The one real autonomy setting in the app: when on, Hamzawi adds his daily
// focus suggestions straight to today's top 3 (when a slot is free) instead
// of waiting for a tap. Off by default. Always reversible from Home.
export default function AutoAddToggle({ userId, initialValue }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [value, setValue] = useState(!!initialValue);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !value;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ auto_add_daily_focus: next }).eq("id", userId);
    setSaving(false);
    if (error) { showToast("حصلت مشكلة، جرّب تاني."); return; }
    setValue(next);
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={toggle}
        disabled={saving}
        className="mt-1 h-4 w-4 accent-[#6F4FC4]"
      />
      <span>
        <span className="block text-sm">حمزاوي يضيف تلقائي مهام اليوم المقترحة</span>
        <span className="block text-xs text-ink-muted dark:text-moon-muted mt-0.5">
          بدل ما يستناك تدوس "أضف"، يحطها في أهم ٣ لوحده (لو فيه مكان فاضي)، وتقدر تشيلها في أي وقت.
        </span>
      </span>
    </label>
  );
}
