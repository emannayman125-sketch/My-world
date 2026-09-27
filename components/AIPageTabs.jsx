"use client";

import { useState } from "react";
import AIChat from "./AIChat";
import BrainDump from "./BrainDump";

export default function AIPageTabs({ userId, strings, locale }) {
  const [tab, setTab] = useState("chat");

  return (
    <>
      <div className="flex gap-2 border-b border-black/[0.06] dark:border-white/[0.06]">
        <button
          onClick={() => setTab("chat")}
          className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
            tab === "chat" ? "border-lantern text-ink dark:text-moon font-medium" : "border-transparent text-ink-muted dark:text-moon-muted"
          }`}
        >
          {strings.ai.chatTab}
        </button>
        <button
          onClick={() => setTab("braindump")}
          className={`px-3 py-2 text-sm border-b-2 -mb-px transition ${
            tab === "braindump" ? "border-lantern text-ink dark:text-moon font-medium" : "border-transparent text-ink-muted dark:text-moon-muted"
          }`}
        >
          {strings.ai.brainDumpTab}
        </button>
      </div>

      {tab === "chat" ? (
        <AIChat strings={strings} locale={locale} userId={userId} />
      ) : (
        <BrainDump userId={userId} strings={strings} locale={locale} />
      )}
    </>
  );
}
