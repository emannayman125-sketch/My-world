"use client";

import { useEffect } from "react";

export default function ReminderNotifier({ todayEvents, strings }) {
  const tr = strings.dashboard.reminder;

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!todayEvents || todayEvents.length === 0) return;

    const now = new Date();
    const timers = [];

    for (const ev of todayEvents) {
      if (!ev.event_time) continue;
      const [h, m] = ev.event_time.split(":").map(Number);
      const eventTime = new Date();
      eventTime.setHours(h, m, 0, 0);

      const msUntil = eventTime - now - 10 * 60 * 1000; // notify 10 minutes ahead
      if (msUntil > 0 && msUntil < 1000 * 60 * 60 * 12) {
        const timer = setTimeout(() => {
          new Notification(tr.title, { body: tr.body.replace("{title}", ev.title) });
        }, msUntil);
        timers.push(timer);
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [todayEvents, tr]);

  return null;
}
