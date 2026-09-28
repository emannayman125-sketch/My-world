"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import EnglishSessionLogger from "./EnglishSessionLogger";

export default function AIChat({ strings, locale, userId }) {
  const ai = strings.ai;
  const [context, setContext] = useState("all");
  const [useKnowledge, setUseKnowledge] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context, useKnowledge, locale }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "no_api_key") {
          setError(ai.errorNoKey);
        } else {
          const detail = data.detail ? ` (${data.error}: ${String(data.detail).slice(0, 200)})` : ` (${data.error})`;
          setError(ai.errorGeneric + detail);
        }
        setLoading(false);
        return;
      }

      setMessages((list) => [...list, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(ai.errorGeneric + ` (client_exception: ${String(err?.message || err).slice(0, 200)})`);
    }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    send();
  }

  const QUICK_ACTIONS = [
    { key: "planDay", context: "all", prompt: ai.quickActions.planDay },
    { key: "practiceEnglish", context: "english", prompt: ai.quickActions.practiceEnglish },
    { key: "mbaHelp", context: "mba", prompt: ai.quickActions.mbaHelp },
    { key: "askLibrary", context: "library", prompt: ai.quickActions.askLibrary },
    { key: "businessHelp", context: "business", prompt: ai.quickActions.businessHelp },
    { key: "supplyChainHelp", context: "supplyChain", prompt: ai.quickActions.supplyChainHelp },
    { key: "developIdea", context: "creator", prompt: ai.quickActions.developIdea },
    { key: "reviewTrading", context: "trading", prompt: ai.quickActions.reviewTrading },
  ];

  function runQuickAction(qa) {
    setContext(qa.context);
    setUseKnowledge(true);
    send(qa.prompt);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{ai.contextLabel}</label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-sage"
          >
            {Object.entries(ai.contexts).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-ink-muted dark:text-moon-muted ms-auto cursor-pointer">
            <input
              type="checkbox"
              checked={useKnowledge}
              onChange={(e) => setUseKnowledge(e.target.checked)}
              className="accent-sage"
            />
            {ai.useKnowledge}
          </label>
        </div>
        {useKnowledge && (
          <p className="text-xs text-ink-muted/80 dark:text-moon-muted/80 leading-5">{ai.useKnowledgeHint}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.key}
              onClick={() => runQuickAction(qa)}
              disabled={loading}
              className="text-xs rounded-full border border-black/10 dark:border-white/10 px-3 py-1.5
                         text-ink-muted dark:text-moon-muted hover:border-sage hover:text-ink dark:hover:text-moon transition disabled:opacity-50"
            >
              {qa.prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="card p-4 min-h-[320px] max-h-[55vh] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft">
              <Sparkles size={20} strokeWidth={2} />
            </span>
            <p className="font-display text-lg">{ai.greeting}</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-soft px-4 py-2.5 text-sm leading-7 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-sage/20 text-ink dark:text-moon"
                  : "bg-black/[0.03] dark:bg-white/[0.05] text-ink dark:text-moon"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-soft px-4 py-2.5 text-sm bg-black/[0.03] dark:bg-white/[0.05] text-ink-muted dark:text-moon-muted">
              {ai.thinking}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {context === "english" && messages.length > 0 && (
        <EnglishSessionLogger userId={userId} messages={messages} strings={strings} />
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ai.inputPlaceholder}
          className="flex-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                     px-4 py-3 text-sm outline-none focus:border-sage"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={ai.send}
          className="rounded-soft bg-lantern text-night font-medium px-4 py-3 hover:brightness-105 transition disabled:opacity-50"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
