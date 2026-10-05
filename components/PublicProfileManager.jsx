"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Globe, Lock } from "lucide-react";

const KIND_EMOJI = { music: "🎵", movie: "🎬", podcast: "🎙️", book: "📚", place: "✈️", hobby: "🎮" };
const CURRENTLY_EMOJI = { listening: "🎧", watching: "🎬", reading: "📚" };

// One place to see — and flip — exactly what shows on the public page.
// No navigating away to three different sections to piece it together.
function Row({ label, sub, isPublic, onToggle, strings: s }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{label}</p>
        {sub && <p className="text-xs text-ink-muted dark:text-moon-muted truncate">{sub}</p>}
      </div>
      <button
        onClick={onToggle}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
          isPublic
            ? "bg-sage/15 text-sage dark:text-sage-soft"
            : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"
        }`}
      >
        {isPublic ? <Globe size={12} /> : <Lock size={12} />}
        {isPublic ? s.public : s.private}
      </button>
    </div>
  );
}

export default function PublicProfileManager({ userId, initialWorld, initialCurrently, initialInterests, strings: s, worldKindLabels, currentlyKindLabels }) {
  const supabase = createClient();
  const [world, setWorld] = useState(initialWorld || []);
  const [currently, setCurrently] = useState(initialCurrently || []);
  const [interests, setInterests] = useState(initialInterests || []);

  async function toggle(table, item, list, setList) {
    const next = !item.is_public;
    setList((l) => l.map((x) => (x.id === item.id ? { ...x, is_public: next } : x))); // optimistic
    const { error } = await supabase.from(table).update({ is_public: next }).eq("id", item.id);
    if (error) setList((l) => l.map((x) => (x.id === item.id ? { ...x, is_public: !next } : x))); // revert
  }

  const worldByKind = {};
  for (const item of world) {
    worldByKind[item.kind] = worldByKind[item.kind] || [];
    worldByKind[item.kind].push(item);
  }

  const empty = world.length === 0 && currently.length === 0 && interests.length === 0;

  return (
    <div className="space-y-5">
      {empty && <p className="text-sm text-ink-muted dark:text-moon-muted">{s.empty}</p>}

      {currently.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-1">{s.currently}</p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {currently.map((c) => (
              <Row
                key={c.id}
                label={`${CURRENTLY_EMOJI[c.kind] || ""} ${currentlyKindLabels[c.kind] || c.kind}: ${c.title}`}
                isPublic={c.is_public}
                onToggle={() => toggle("currently_items", c, currently, setCurrently)}
                strings={s}
              />
            ))}
          </div>
        </section>
      )}

      {Object.entries(worldByKind).map(([kind, items]) => (
        <section key={kind}>
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-1">
            {KIND_EMOJI[kind] || ""} {worldKindLabels[kind]?.label || kind}
          </p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((w) => (
              <Row
                key={w.id}
                label={w.title}
                sub={w.subtitle}
                isPublic={w.is_public}
                onToggle={() => toggle("world_items", w, world, setWorld)}
                strings={s}
              />
            ))}
          </div>
        </section>
      ))}

      {interests.length > 0 && (
        <section>
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted mb-1">{s.interests}</p>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {interests.map((i) => (
              <Row
                key={i.id}
                label={i.value}
                isPublic={i.is_public}
                onToggle={() => toggle("interests", i, interests, setInterests)}
                strings={s}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
