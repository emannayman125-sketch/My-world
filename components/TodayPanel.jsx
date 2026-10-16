"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import DailyBrief from "./DailyBrief";
import TopThree from "./TopThree";

// One card for "today": Hamzawi's suggestions on top, and underneath
// them today's top 3 as a dropdown (open by default). Tapping "Add" on
// a suggestion drops it straight into the list below.
export default function TodayPanel({ userId, strings, locale, initialTasks }) {
  const tr = strings.dashboard.topThree;
  const [tasks, setTasks] = useState(initialTasks || []);
  const [open, setOpen] = useState(true);
  const doneCount = tasks.filter((t) => t.is_done).length;

  return (
    <section className="rounded-card border border-dusk/20 bg-dusk/[0.05] dark:bg-dusk/[0.10] overflow-hidden">
      <DailyBrief
        embedded
        locale={locale}
        strings={strings.dashboard.brief}
        top3Titles={tasks.map((t) => t.title)}
        top3Count={tasks.length}
        onAdded={(row) => setTasks((list) => [...list, row])}
      />

      <div className="border-t border-dusk/15 bg-paper-card dark:bg-night-card">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-5 py-4 text-start"
        >
          <span className="font-display text-xl flex-1">{tr.heading}</span>
          <span className="text-sm text-ink-muted dark:text-moon-muted">
            {doneCount}/{tasks.length || 3}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-ink-muted dark:text-moon-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="px-5 pb-5">
            <TopThree
              embedded
              userId={userId}
              strings={strings}
              tasks={tasks}
              onTasksChange={setTasks}
            />
          </div>
        )}
      </div>
    </section>
  );
}
