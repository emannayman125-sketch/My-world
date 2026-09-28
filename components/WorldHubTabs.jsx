"use client";

import { useState } from "react";
import WorldManager from "./WorldManager";
import InterestsManager from "./InterestsManager";
import JournalManager from "./JournalManager";
import TimelineManager from "./TimelineManager";
import MessagesManager from "./MessagesManager";
import TimeCapsuleManager from "./TimeCapsuleManager";

// Consolidates what used to be six separate sidebar links (My World,
// Interests, Journal, Memories, Messages, Time Capsule) into one hub
// with internal tabs -- same pattern as AIPageTabs.jsx.
export default function WorldHubTabs({ userId, strings, data }) {
  const [tab, setTab] = useState("world");

  const tabs = [
    { key: "world", label: `🎧 ${strings.nav.world}` },
    { key: "interests", label: strings.nav.interests },
    { key: "journal", label: `📝 ${strings.nav.journal}` },
    { key: "timeline", label: `🗺️ ${strings.nav.timeline}` },
    { key: "messages", label: `💌 ${strings.nav.messages}` },
    { key: "timeCapsule", label: strings.timeCapsule.title },
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

      {tab === "world" && (
        <WorldManager userId={userId} initialItems={data.world} strings={strings} />
      )}
      {tab === "interests" && (
        <InterestsManager userId={userId} initialInterests={data.interests} strings={strings} />
      )}
      {tab === "journal" && (
        <JournalManager userId={userId} initialNotes={data.journal} strings={strings} />
      )}
      {tab === "timeline" && (
        <TimelineManager userId={userId} initialMemories={data.timeline} strings={strings} />
      )}
      {tab === "messages" && (
        <>
          <p className="text-sm text-ink-muted dark:text-moon-muted mb-4">
            {strings.legacy.messages.subtitle}
          </p>
          <MessagesManager userId={userId} initialMessages={data.messages} strings={strings} />
        </>
      )}
      {tab === "timeCapsule" && (
        <>
          <p className="text-ink-muted dark:text-moon-muted mb-4">{strings.timeCapsule.subtitle}</p>
          <TimeCapsuleManager userId={userId} initialCapsules={data.timeCapsule} strings={strings} />
        </>
      )}
    </div>
  );
}
