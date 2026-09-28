"use client";

import { useState } from "react";
import TasksManager from "./TasksManager";
import MatrixBoard from "./MatrixBoard";
import CalendarView from "./CalendarView";
import DailyResetManager from "./DailyResetManager";

// Consolidates what used to be four separate sidebar links (Tasks,
// Priority Matrix, Planner, Reset the day) into one hub with internal
// tabs -- same pattern as AIPageTabs.jsx / WorldHubTabs.jsx.
export default function ProductivityHubTabs({ userId, strings, locale, data }) {
  const [tab, setTab] = useState("tasks");

  const tabs = [
    { key: "tasks", label: `✅ ${strings.nav.tasks}` },
    { key: "matrix", label: strings.nav.matrix },
    { key: "calendar", label: `📅 ${strings.nav.calendar}` },
    { key: "reset", label: `🧹 ${strings.nav.reset}` },
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

      {tab === "tasks" && (
        <TasksManager userId={userId} initialTasks={data.tasks} strings={strings} />
      )}

      {tab === "matrix" && (
        <div>
          <p className="text-ink-muted dark:text-moon-muted -mt-1 mb-4">{strings.matrix.subtitle}</p>
          <MatrixBoard userId={userId} initialTasks={data.matrixTasks} strings={strings} />
        </div>
      )}

      {tab === "calendar" && (
        <CalendarView userId={userId} initialEvents={data.events} strings={strings} locale={locale} />
      )}

      {tab === "reset" && (
        <div className="space-y-6">
          <p className="text-ink-muted dark:text-moon-muted -mt-1">{strings.legacy.reset.subtitle}</p>
          <DailyResetManager
            userId={userId}
            yesterdayTasks={data.yesterdayTasks}
            todayCount={data.todayCount}
            strings={strings}
          />
          {data.todayEvents.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-lg mb-3">{strings.legacy.reset.todayEvents}</h2>
              <ul className="space-y-1 text-sm">
                {data.todayEvents.map((ev) => (
                  <li key={ev.id}>
                    {ev.event_time && (
                      <span className="text-ink-muted dark:text-moon-muted">{ev.event_time} — </span>
                    )}
                    {ev.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
