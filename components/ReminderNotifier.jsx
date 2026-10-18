"use client";

import { useEffect } from "react";

// Study blocks (category "دراسة") get their own wording, plus a second
// nudge right at the start time. Everything else keeps the usual
// "10 minutes ahead" reminder.
const STUDY = {
  rtl: {
    title: "وقت المذاكرة 📚",
    soon: "{title} بعد ١٠ دقايق — جهّزي نفسك",
    now: "يلا نبدأ: {title}",
  },
  ltr: {
    title: "Study time 📚",
    soon: "{title} in 10 minutes — get ready",
    now: "Let's begin: {title}",
  },
};

export default function ReminderNotifier({ todayEvents, contentDueToday, strings }) {
  const tr = strings.dashboard.reminder;
  const study = STUDY[strings.dir] || STUDY.rtl;
  const platformLabels = strings.creator.platforms;

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

      const isStudy = ev.category === "دراسة";
      const msUntil = eventTime - now - 10 * 60 * 1000; // notify 10 minutes ahead
      if (msUntil > 0 && msUntil < 1000 * 60 * 60 * 12) {
        const timer = setTimeout(() => {
          new Notification(isStudy ? study.title : tr.title, {
            body: (isStudy ? study.soon : tr.body).replace("{title}", ev.title),
          });
        }, msUntil);
        timers.push(timer);
      }
      if (isStudy) {
        const msStart = eventTime - now;
        if (msStart > 0 && msStart < 1000 * 60 * 60 * 12) {
          timers.push(
            setTimeout(() => {
              new Notification(study.title, { body: study.now.replace("{title}", ev.title) });
            }, msStart)
          );
        }
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [todayEvents, tr, study]);

  // Same mechanism as events above, but for content_items he flagged
  // "remind me" on (publish_time, not 10 minutes early -- the point here
  // is "go post it now", not "get ready").
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!contentDueToday || contentDueToday.length === 0) return;

    const now = new Date();
    const timers = [];

    for (const item of contentDueToday) {
      if (!item.publish_time) continue;
      const [h, m] = item.publish_time.split(":").map(Number);
      const publishAt = new Date();
      publishAt.setHours(h, m, 0, 0);

      const msUntil = publishAt - now;
      if (msUntil > 0 && msUntil < 1000 * 60 * 60 * 12) {
        const timer = setTimeout(() => {
          const platform = platformLabels[item.platform] || item.platform;
          new Notification(tr.contentTitle, { body: tr.contentBody.replace("{title}", item.title).replace("{platform}", platform) });
        }, msUntil);
        timers.push(timer);
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [contentDueToday, tr, platformLabels]);

  return null;
}
