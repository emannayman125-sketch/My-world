"use client";

// Voice for Hamzawi, using the browser's built-in speech engines:
//   - SpeechRecognition (speech -> text)   : Chrome / Edge / Android Chrome / Safari 14.1+
//   - speechSynthesis   (text -> speech)   : all modern browsers
// No extra API keys or cost. Note: in Chrome the recognition itself is done by
// Google's servers, so audio leaves the device while the mic button is active.

import { useCallback, useEffect, useRef, useState } from "react";

const LANG = { ar: "ar-EG", en: "en-US" };

// Make an AI reply sound like speech: drop markdown, code, links and emojis.
export function stripForSpeech(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[*_`#>~|]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Chrome cuts long utterances after ~15s, so speak in short chunks.
function chunk(text, max = 180) {
  const sentences = text.match(/[^.!?؟\n]+[.!?؟]*/g) || [text];
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/**
 * @param {{ locale?: "ar"|"en", onFinalTranscript?: (text: string) => void, onEmpty?: () => void }} opts
 */
export function useVoice({ locale = "ar", onFinalTranscript, onEmpty } = {}) {
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(""); // "", "not-allowed", "no-speech", "network", "other"

  const recRef = useRef(null);
  const speakToken = useRef(0);
  const finalCb = useRef(onFinalTranscript);
  const emptyCb = useRef(onEmpty);
  finalCb.current = onFinalTranscript;
  emptyCb.current = onEmpty;

  useEffect(() => {
    setCanListen(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    setCanSpeak("speechSynthesis" in window);
    return () => {
      try { recRef.current?.abort(); } catch {}
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    speakToken.current++; // invalidates any queued chunk callbacks
    try { window.speechSynthesis?.cancel(); } catch {}
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, onDone) => {
      const clean = stripForSpeech(text);
      if (!clean || !("speechSynthesis" in window)) {
        onDone?.();
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel();
      const token = ++speakToken.current;
      const lang = LANG[locale] || "ar-EG";
      const voices = synth.getVoices();
      const voice =
        voices.find((v) => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(locale));

      const parts = chunk(clean);
      setSpeaking(true);
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = lang;
        if (voice) u.voice = voice;
        const last = i === parts.length - 1;
        u.onend = () => {
          if (token !== speakToken.current) return;
          if (last) {
            setSpeaking(false);
            onDone?.();
          }
        };
        u.onerror = () => {
          if (token !== speakToken.current) return;
          if (last) {
            setSpeaking(false);
            onDone?.();
          }
        };
        synth.speak(u);
      });
    },
    [locale]
  );

  const stopListening = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopSpeaking(); // never listen to ourselves
    try { recRef.current?.abort(); } catch {}

    const rec = new SR();
    rec.lang = LANG[locale] || "ar-EG";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = "";
    let failed = false;
    setError("");
    setInterim("");

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim((finalText + " " + interimText).trim());
    };
    rec.onerror = (e) => {
      failed = true;
      const code = e.error;
      if (code === "not-allowed" || code === "service-not-allowed") setError("not-allowed");
      else if (code === "no-speech") setError("no-speech");
      else if (code === "network") setError("network");
      else if (code !== "aborted") setError("other");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      const text = finalText.trim();
      if (text) finalCb.current?.(text);
      else emptyCb.current?.(failed);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [locale, stopSpeaking]);

  return {
    canListen,
    canSpeak,
    listening,
    speaking,
    interim,
    error,
    clearError: () => setError(""),
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
