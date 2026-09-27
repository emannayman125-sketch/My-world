"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function DailyResetManager({ userId, yesterdayTasks, todayCount, strings }) {
  const tr = strings.legacy.reset;
  const supabase = createClient();
  const [moved, setMoved] = useState(false);
  const [busy, setBusy] = useState(false);

  const done = yesterdayTasks.filter((t) => t.is_done);
  const undone = yesterdayTasks.filter((t) => !t.is_done);
  const today = new Date().toISOString().slice(0, 10);
  const remainingSlots = Math.max(0, 3 - todayCount);

  async function moveUnfinished() {
    setBusy(true);
    const toMove = undone.slice(0, remainingSlots);

    for (const task of toMove) {
      await supabase.from("top3_tasks").insert({ user_id: userId, title: task.title, for_date: today });
    }

    setBusy(false);
    setMoved(true);
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h2 className="font-display text-lg mb-3">{tr.doneYesterday}</h2>
        {done.length === 0 && <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noneDone}</p>}
        <ul className="space-y-1 text-sm">
          {done.map((t) => (
            <li key={t.id} className="text-ink-muted dark:text-moon-muted line-through">{t.title}</li>
          ))}
        </ul>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg mb-3">{tr.stillLeft}</h2>
        {undone.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.allClear}</p>
        ) : (
          <>
            <ul className="space-y-1 text-sm mb-4">
              {undone.map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
            </ul>
            {!moved ? (
              <button
                onClick={moveUnfinished}
                disabled={busy || remainingSlots === 0}
                className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105 disabled:opacity-50"
              >
                {remainingSlots === 0 ? tr.top3Full : tr.moveTo.replace("{n}", Math.min(undone.length, remainingSlots))}
              </button>
            ) : (
              <p className="text-sm text-dusk">{tr.moved}</p>
            )}
          </>
        )}
      </div>

      <Link
        href="/dashboard"
        className="block text-center rounded-soft bg-black/5 dark:bg-white/5 py-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
      >
        {tr.goToTop3}
      </Link>
    </div>
  );
}
