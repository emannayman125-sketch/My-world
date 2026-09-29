"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Instagram, Youtube, Music2, Twitter, Link as LinkIcon } from "lucide-react";

// The ONLY account links Ahmed chooses to put on his public page. Nothing
// here is inferred; every field starts empty and is entered by him.
const PLATFORMS = [
  { key: "instagram", Icon: Instagram, prefix: "instagram.com/" },
  { key: "youtube", Icon: Youtube, prefix: "youtube.com/@" },
  { key: "tiktok", Icon: Music2, prefix: "tiktok.com/@" },
  { key: "x", Icon: Twitter, prefix: "x.com/" },
  { key: "website", Icon: LinkIcon, prefix: "" },
];

export default function SocialLinksEditor({ userId, initialLinks, strings: s }) {
  const supabase = createClient();
  const [links, setLinks] = useState(() => {
    const base = { instagram: "", youtube: "", tiktok: "", x: "", website: "" };
    return { ...base, ...(initialLinks || {}) };
  });
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("");
    const cleaned = Object.fromEntries(
      Object.entries(links).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)
    );
    const { error } = await supabase.from("profiles").update({ social_links: cleaned }).eq("id", userId);
    setStatus(error ? s.saveError : s.saved);
    if (!error) setLinks((prev) => ({ ...prev, ...cleaned }));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted dark:text-moon-muted">{s.hint}</p>
      {PLATFORMS.map(({ key, Icon, prefix }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-ink-muted dark:text-moon-muted">
            <Icon size={15} />
          </span>
          <div className="flex-1 flex items-center rounded-soft border border-black/10 dark:border-white/10 focus-within:border-sage overflow-hidden">
            {prefix && (
              <span className="pl-3 text-xs text-ink-muted dark:text-moon-muted shrink-0" dir="ltr">
                {prefix}
              </span>
            )}
            <input
              dir="ltr"
              value={links[key]}
              onChange={(e) => setLinks((l) => ({ ...l, [key]: e.target.value }))}
              placeholder={s.placeholders[key]}
              className="flex-1 min-w-0 bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={save} className="rounded-soft bg-lantern text-lantern-ink text-sm font-medium px-5 py-2 shadow-lantern hover:brightness-105 transition">
          {s.save}
        </button>
        {status && <span className="text-xs text-ink-muted dark:text-moon-muted">{status}</span>}
      </div>
    </div>
  );
}
