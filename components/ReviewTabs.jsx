"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { todayISO, weekStartISO } from "@/lib/time";

export default function ReviewTabs({ userId, todayReview, weekReview, strings }) {
  const g = strings.growthHub;
  const supabase = createClient();
  const [tab, setTab] = useState("evening");

  const [accomplished, setAccomplished] = useState(todayReview?.accomplished || "");
  const [proudOf, setProudOf] = useState(todayReview?.proud_of || "");
  const [savedEvening, setSavedEvening] = useState(true);

  const [tasksCompleted, setTasksCompleted] = useState(weekReview?.tasks_completed ?? 0);
  const [goalsAchieved, setGoalsAchieved] = useState(weekReview?.goals_achieved ?? 0);
  const [bestStreak, setBestStreak] = useState(weekReview?.best_streak || "");
  const [focusNext, setFocusNext] = useState(weekReview?.focus_next || "");
  const [savedWeekly, setSavedWeekly] = useState(true);

  async function saveEvening() {
    await supabase.from("evening_reviews").upsert(
      { user_id: userId, review_date: todayISO(), accomplished, proud_of: proudOf },
      { onConflict: "user_id,review_date" }
    );
    setSavedEvening(true);
  }

  async function saveWeekly() {
    await supabase.from("weekly_reviews").upsert(
      {
        user_id: userId,
        week_start: weekStartISO(),
        tasks_completed: tasksCompleted,
        goals_achieved: goalsAchieved,
        best_streak: bestStreak,
        focus_next: focusNext,
      },
      { onConflict: "user_id,week_start" }
    );
    setSavedWeekly(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setTab("evening")}
          className={`rounded-full px-4 py-2 ${tab === "evening" ? "bg-ink text-paper dark:bg-moon dark:text-night" : "bg-black/5 dark:bg-white/5"}`}
        >
          {g.eveningTab}
        </button>
        <button
          onClick={() => setTab("weekly")}
          className={`rounded-full px-4 py-2 ${tab === "weekly" ? "bg-ink text-paper dark:bg-moon dark:text-night" : "bg-black/5 dark:bg-white/5"}`}
        >
          {g.weeklyTab}
        </button>
      </div>

      {tab === "evening" && (
        <div className="card p-6 space-y-4">
          <p className="font-display text-lg">{g.beforeYouFinish}</p>
          <div>
            <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">
              {g.whatDidYouDo}
            </label>
            <textarea
              rows={3}
              value={accomplished}
              onChange={(e) => { setAccomplished(e.target.value); setSavedEvening(false); }}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">
              {g.whatAreYouProudOf}
            </label>
            <textarea
              rows={3}
              value={proudOf}
              onChange={(e) => { setProudOf(e.target.value); setSavedEvening(false); }}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveEvening}
              disabled={savedEvening}
              className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105 disabled:opacity-50"
            >
              {savedEvening ? g.saved : g.save}
            </button>
          </div>
        </div>
      )}

      {tab === "weekly" && (
        <div className="card p-6 space-y-4">
          <p className="font-display text-lg">{g.yourWeek}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">{g.tasksCompleted}</label>
              <input
                type="number" min="0"
                value={tasksCompleted}
                onChange={(e) => { setTasksCompleted(Number(e.target.value)); setSavedWeekly(false); }}
                className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">{g.goalsAchieved}</label>
              <input
                type="number" min="0"
                value={goalsAchieved}
                onChange={(e) => { setGoalsAchieved(Number(e.target.value)); setSavedWeekly(false); }}
                className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">{g.bestHabit}</label>
            <input
              value={bestStreak}
              onChange={(e) => { setBestStreak(e.target.value); setSavedWeekly(false); }}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">
              {g.focusNextWeek}
            </label>
            <textarea
              rows={3}
              value={focusNext}
              onChange={(e) => { setFocusNext(e.target.value); setSavedWeekly(false); }}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveWeekly}
              disabled={savedWeekly}
              className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105 disabled:opacity-50"
            >
              {savedWeekly ? g.saved : g.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
