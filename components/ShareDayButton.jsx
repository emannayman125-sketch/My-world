"use client";

import { useToast } from "./ToastProvider";

export default function ShareDayButton({ name, top3, events, strings }) {
  const tr = strings.dashboard.shareDay;
  const { showToast } = useToast();

  async function handleShare() {
    const lines = [tr.scheduleFor.replace("{name}", name), ""];

    if (top3?.length > 0) {
      lines.push(tr.top3Label);
      top3.forEach((t) => lines.push(`${t.is_done ? "✓" : "○"} ${t.title}`));
      lines.push("");
    }

    if (events?.length > 0) {
      lines.push(tr.eventsLabel);
      events.forEach((e) => lines.push(`${e.event_time ? e.event_time + " - " : ""}${e.title}`));
    }

    const text = lines.join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // Share was cancelled — fall back to clipboard
      }
    }

    await navigator.clipboard.writeText(text);
    showToast(tr.copied);
  }

  return (
    <button
      onClick={handleShare}
      className="rounded-soft bg-lantern text-white text-sm px-4 py-2 hover:brightness-105 transition"
    >
      {tr.button}
    </button>
  );
}
