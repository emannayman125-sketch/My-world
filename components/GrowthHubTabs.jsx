"use client";

import { useState } from "react";
import GoalsManager from "./GoalsManager";
import HabitsManager from "./HabitsManager";
import ReviewTabs from "./ReviewTabs";

// Consolidates what used to be three separate pages (Goals, Habits,
// Review) into one hub with internal tabs -- same pattern as
// WorldHubTabs.jsx / ProductivityHubTabs.jsx.
export default function GrowthHubTabs({ userId, strings, data }) {
  const [tab, setTab] = useState("goals");
  const g = strings.growthHub;

  const tabs = [
    { key: "goals", label: `🏆 ${g.goals}` },
    { key: "habits", label: `🔥 ${g.habits}` },
    { key: "review", label: `📊 ${g.review}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto border-b border-black/[0.06] dark:border-white/[0.06]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 py-2 text-sm border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t.key
                ? "border-ink dark:border-moon text-ink dark:text-moon font-medium"
                : "border-transparent text-ink-muted dark:text-moon-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "goals" && (
        <GoalsManager userId={userId} initialGoals={data.goals} strings={strings} />
      )}
      {tab === "habits" && (
        <HabitsManager userId={userId} initialHabits={data.habits} initialLogsToday={data.habitLogsToday} strings={strings} />
      )}
      {tab === "review" && (
        <ReviewTabs userId={userId} todayReview={data.todayReview} weekReview={data.weekReview} strings={strings} />
      )}
    </div>
  );
}
