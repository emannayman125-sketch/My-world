"use client";

import { useState } from "react";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

const LABEL = {
  ar: { hide: "إخفاء الفيديو", play: "▶️ تشغيل الفيديو هنا", open: "🔗 فتح الرابط" },
  en: { hide: "Hide video", play: "▶️ Play video here", open: "🔗 Open link" },
};

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
    }
  } catch {
    return null;
  }
  return null;
}

export default function LinkField({ url }) {
  const [expanded, setExpanded] = useState(false);
  const locale = getClientLocale();
  const l = LABEL[locale] || LABEL.en;
  if (!url) return null;

  const videoId = getYouTubeId(url);

  if (videoId) {
    return (
      <div className="mt-2">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs rounded-full bg-red-500/10 text-red-500 px-3 py-1 hover:bg-red-500/20 transition"
        >
          {expanded ? l.hide : l.play}
        </button>
        {expanded && (
          <div className="mt-2 rounded-soft overflow-hidden aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs rounded-full bg-dusk/15 text-dusk px-3 py-1 hover:bg-dusk/25 transition inline-block mt-2"
    >
      {l.open}
    </a>
  );
}
