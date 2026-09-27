"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export default function AddThoughtForm({ userId, strings }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const q = strings.quote;

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await supabase.from("notes").insert({
      user_id: userId,
      kind: "quote",
      content: text.trim(),
    });
    setSaving(false);
    setText("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-muted dark:text-moon-muted
                   hover:text-lantern transition"
      >
        <Plus size={13} strokeWidth={2} />
        {q.addThought}
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={q.placeholder}
        rows={2}
        className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                   px-3 py-2 text-sm outline-none focus:border-lantern resize-none"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="rounded-soft bg-lantern text-night text-xs font-medium px-3 py-1.5
                     hover:brightness-105 transition disabled:opacity-50"
        >
          {saving ? q.saving : q.save}
        </button>
        <button
          onClick={() => { setOpen(false); setText(""); }}
          className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
        >
          {q.cancel}
        </button>
      </div>
    </div>
  );
}
