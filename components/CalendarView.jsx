"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { useToast } from "./ToastProvider";
import GoogleCalendarSync from "./GoogleCalendarSync";
import LinkField from "./LinkField";

const CATEGORY_EMOJI = {
  "عمل": "💼", "دراسة": "📚", "شخصي": "👤", "صحة": "🏃", "مهم": "❤️",
};
const CATEGORY_KEYS = Object.keys(CATEGORY_EMOJI);

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function generateICS(events) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Personal World//AR"];

  for (const ev of events) {
    const dateStr = ev.event_date.replace(/-/g, "");
    const timeStr = ev.event_time ? ev.event_time.replace(/:/g, "").slice(0, 4) + "00" : "090000";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@personal-world`,
      `DTSTART:${dateStr}T${timeStr}`,
      `SUMMARY:${ev.title.replace(/\n/g, " ")}`,
      ev.notes ? `DESCRIPTION:${ev.notes.replace(/\n/g, " ")}` : "",
      `CATEGORIES:${ev.category}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export default function CalendarView({ userId, initialEvents, strings, locale }) {
  const tr = strings.legacy.calendar;
  const supabase = createClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [events, setEvents] = useState(initialEvents || []);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [form, setForm] = useState({ title: "", category: CATEGORY_KEYS[2], event_time: "", notes: "", link_url: "" });

  const monthLabel = cursor.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      map[ev.event_date] = map[ev.event_date] || [];
      map[ev.event_date].push(ev);
    }
    return map;
  }, [events]);

  async function addEvent(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        category: form.category,
        event_date: selectedDate,
        event_time: form.event_time || null,
        notes: form.notes.trim() || null,
        link_url: form.link_url.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setEvents((list) => [...list, data]);
      setForm({ title: "", category: form.category, event_time: "", notes: "", link_url: "" });
    }
  }

  async function removeEvent(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { showToast("حصلت مشكلة، جرّب تاني."); return; }
    setEvents((list) => list.filter((e) => e.id !== id));
  }

  function exportICS() {
    const ics = generateICS(events);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "personal-world-events.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  const todayISO = toISODate(new Date());
  const selectedEvents = eventsByDate[selectedDate] || [];

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            ‹
          </button>
          <h2 className="font-display text-lg">{monthLabel}</h2>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            ›
          </button>
        </div>

        <div className="flex justify-end gap-2 mb-3">
          <GoogleCalendarSync events={events} onSynced={() => {}} />
          <button
            onClick={exportICS}
            className="text-xs rounded-full bg-black/5 dark:bg-white/5 px-3 py-1.5 hover:bg-black/10 dark:hover:bg-white/10"
          >
            {tr.exportIcs}
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-muted dark:text-moon-muted mb-1">
          {tr.weekdays.map((w) => <div key={w}>{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const iso = toISODate(day);
            const dayEvents = eventsByDate[iso] || [];
            const isToday = iso === todayISO;
            const isSelected = iso === selectedDate;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(iso)}
                className={`aspect-square rounded-soft text-sm flex flex-col items-center justify-center gap-0.5 relative
                  ${isSelected ? "bg-ink text-paper dark:bg-moon dark:text-night" : isToday ? "bg-dusk/20" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
              >
                <span>{day.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-dusk" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-display text-lg mb-3">{selectedDate}</h3>

        <ul className="space-y-2 mb-4">
          {selectedEvents.length === 0 && (
            <li className="text-sm text-ink-muted dark:text-moon-muted">{tr.noEvents}</li>
          )}
          {selectedEvents.map((ev) => (
            <li key={ev.id} className="rounded-soft px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span>
                  {CATEGORY_EMOJI[ev.category] || "📌"} {ev.title}
                  {ev.event_time && <span className="text-ink-muted dark:text-moon-muted"> — {ev.event_time}</span>}
                </span>
                <button onClick={() => removeEvent(ev.id)} className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm">
                  {tr.delete}
                </button>
              </div>
              <LinkField url={ev.link_url} />
            </li>
          ))}
        </ul>

        <form onSubmit={addEvent} className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={tr.titlePlaceholder}
              className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
            >
              {CATEGORY_KEYS.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_EMOJI[cat]} {tr.categories[cat]}</option>
              ))}
            </select>
            <input
              type="time"
              value={form.event_time}
              onChange={(e) => setForm({ ...form, event_time: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
            />
            <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105">
              {tr.add}
            </button>
          </div>
          <input
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder={tr.linkPlaceholder}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
        </form>
      </div>
    </div>
  );
}
