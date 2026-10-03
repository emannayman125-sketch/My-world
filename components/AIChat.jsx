"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Mic, Square, Volume2, VolumeX, Zap, Check, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import EnglishSessionLogger from "./EnglishSessionLogger";
import { useVoice } from "@/lib/useVoice";

export default function AIChat({ strings, locale, userId }) {
  const ai = strings.ai;
  const [context, setContext] = useState("all");
  const [useKnowledge, setUseKnowledge] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agentMode, setAgentMode] = useState(true);
  const bottomRef = useRef(null);
  const router = useRouter();

  // ---- voice ---------------------------------------------------------------
  const v = ai.voice;
  const [speakReplies, setSpeakReplies] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const handsFreeRef = useRef(false);
  const speakRepliesRef = useRef(false);
  const sendRef = useRef(null);
  handsFreeRef.current = handsFree;
  speakRepliesRef.current = speakReplies;

  const voice = useVoice({
    locale,
    onFinalTranscript: (t) => sendRef.current?.(t, true),
    // Nothing heard (or mic error): leave hands-free mode instead of looping forever.
    onEmpty: () => setHandsFree(false),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function toggleHandsFree() {
    if (handsFree) {
      setHandsFree(false);
      voice.stopListening();
      voice.stopSpeaking();
    } else {
      setHandsFree(true);
      handsFreeRef.current = true;
      voice.startListening();
    }
  }

  function toggleSpeakReplies() {
    if (speakReplies) voice.stopSpeaking();
    setSpeakReplies(!speakReplies);
  }

  async function send(text, viaVoice = false) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const endpoint = agentMode ? "/api/ai/agent" : "/api/ai/chat";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context, useKnowledge, locale, voice: viaVoice || handsFreeRef.current }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "no_api_key") {
          setError(ai.errorNoKey);
        } else if (data.error === "upstream_error:503" || data.error === "upstream_error:429") {
          setError(ai.errorBusy);
        } else {
          const detail = data.detail ? ` (${data.error}: ${String(data.detail).slice(0, 200)})` : ` (${data.error})`;
          setError(ai.errorGeneric + detail);
        }
        setLoading(false);
        return;
      }

      setMessages((list) => [...list, { role: "assistant", content: data.reply, actions: data.actions }]);
      if (data.actions?.length > 0) router.refresh(); // reflect real changes elsewhere in the app

      if (viaVoice || speakRepliesRef.current || handsFreeRef.current) {
        voice.speak(data.reply, () => {
          // Conversation mode: after Hamzawi finishes talking, listen again.
          if (handsFreeRef.current) voice.startListening();
        });
      }
    } catch (err) {
      setError(ai.errorGeneric + ` (client_exception: ${String(err?.message || err).slice(0, 200)})`);
    }
    setLoading(false);
  }

  sendRef.current = send;

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

  function describeAction(action) {
    const { name, args, result } = action;
    const label = ai.actions[name] || name;
    if (!result?.ok) {
      if (result?.error === "ambiguous") return null; // the model already asks for clarification in its own reply
      return { ok: false, label };
    }
    const detail = args?.title || args?.name || args?.symbol || "";
    return { ok: true, label, detail };
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
        <button
          type="button"
          onClick={() => setAgentMode((v) => !v)}
          aria-pressed={agentMode}
          className={`w-full flex items-center gap-2 rounded-soft border px-3 py-2 text-xs transition ${
            agentMode
              ? "border-dusk/40 bg-dusk/10 text-dusk"
              : "border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted"
          }`}
        >
          <Zap size={13} strokeWidth={2.2} />
          <span className="font-medium">{agentMode ? ai.agentModeOn : ai.agentModeOff}</span>
          <span className="opacity-75">— {agentMode ? ai.agentModeOnHint : ai.agentModeOffHint}</span>
        </button>
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
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-soft px-4 py-2.5 text-sm leading-7 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-sage/20 text-ink dark:text-moon"
                  : "bg-black/[0.03] dark:bg-white/[0.05] text-ink dark:text-moon"
              }`}
            >
              {m.content}
            </div>
            {m.actions?.length > 0 && (
              <div className="max-w-[85%] mt-1.5 flex flex-wrap gap-1.5">
                {m.actions.map((action, j) => {
                  const d = describeAction(action);
                  if (!d) return null;
                  return (
                    <span
                      key={j}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${
                        d.ok
                          ? "bg-dusk/10 text-dusk"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {d.ok ? <Check size={11} /> : <XIcon size={11} />}
                      {d.label}
                      {d.detail && <span className="opacity-70">· {d.detail}</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-soft px-4 py-2.5 text-sm bg-black/[0.03] dark:bg-white/[0.05] text-ink-muted dark:text-moon-muted">
              {agentMode ? ai.acting : ai.thinking}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {context === "english" && messages.length > 0 && (
        <EnglishSessionLogger userId={userId} messages={messages} strings={strings} />
      )}

      {(voice.canListen || voice.canSpeak) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {voice.canSpeak && (
            <button
              type="button"
              onClick={toggleSpeakReplies}
              aria-pressed={speakReplies}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
                speakReplies
                  ? "border-sage bg-sage/15 text-ink dark:text-moon"
                  : "border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted"
              }`}
            >
              {speakReplies ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {v.speakReplies}
            </button>
          )}
          {voice.canListen && voice.canSpeak && (
            <button
              type="button"
              onClick={toggleHandsFree}
              aria-pressed={handsFree}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
                handsFree
                  ? "border-sage bg-sage text-white"
                  : "border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted"
              }`}
            >
              <Mic size={14} />
              {handsFree ? v.handsFreeOn : v.handsFree}
            </button>
          )}
          {voice.speaking && (
            <button
              type="button"
              onClick={voice.stopSpeaking}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 px-3 py-1.5 text-ink-muted dark:text-moon-muted"
            >
              <Square size={12} /> {v.stopSpeaking}
            </button>
          )}
        </div>
      )}
      {handsFree && <p className="text-xs text-ink-muted dark:text-moon-muted">{v.handsFreeHint}</p>}
      {!voice.canListen && (
        <p className="text-xs text-ink-muted/80 dark:text-moon-muted/80">{v.unsupported}</p>
      )}
      {voice.error && (
        <p className="text-xs text-red-500">
          {voice.error === "not-allowed" ? v.errNotAllowed
            : voice.error === "no-speech" ? v.errNoSpeech
            : voice.error === "network" ? v.errNetwork
            : v.errOther}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {voice.canListen && (
          <button
            type="button"
            onClick={voice.listening ? voice.stopListening : voice.startListening}
            aria-label={voice.listening ? v.stop : v.mic}
            aria-pressed={voice.listening}
            className={`shrink-0 rounded-full p-3 transition ${
              voice.listening
                ? "bg-sage text-white animate-pulse"
                : "bg-sage/15 text-sage dark:text-sage-soft hover:bg-sage/25"
            }`}
          >
            {voice.listening ? <Square size={16} strokeWidth={2} /> : <Mic size={16} strokeWidth={2} />}
          </button>
        )}
        <input
          value={voice.listening ? voice.interim : input}
          readOnly={voice.listening}
          onChange={(e) => setInput(e.target.value)}
          placeholder={voice.listening ? v.listening : ai.inputPlaceholder}
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
