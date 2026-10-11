"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, FileText, Loader2, Sparkles } from "lucide-react";

const MAX_IMAGE_MB = 8;

// "Hand Hamzawi your plan" — type it, or send a photo of it (handwritten or
// printed), and he turns every item he can find into real tasks/habits/goals.
// A real .docx/.xlsx isn't parsed here (see the API route's comment on why),
// so a non-image file is read as plain text client-side with FileReader —
// works well for .txt/.csv and for a .docx pasted-as-text, not a true binary
// Word parse. The hint under the upload button says this plainly.
export default function PlanImport({ strings: s }) {
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [text, setText] = useState("");
  const [fileInfo, setFileInfo] = useState(null); // { name, kind: "image"|"text", mimeType, data (base64 or text) }
  const [status, setStatus] = useState("idle"); // idle | reading | sending | done | error
  const [result, setResult] = useState(null); // { reply, actions }
  const [errorDetail, setErrorDetail] = useState("");
  const fileInputRef = useRef(null);

  function resetFile() {
    setFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("reading");
    setResult(null);
    setErrorDetail("");

    const isImage = file.type.startsWith("image/");
    if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setStatus("error");
      setErrorDetail(s.imageTooBig);
      resetFile();
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setStatus("error");
      setErrorDetail(s.readError);
    };
    if (isImage) {
      reader.onload = () => {
        // result is a data: URL ("data:image/png;base64,AAAA...") -- Gemini
        // wants just the base64 payload, so strip the prefix.
        const base64 = String(reader.result).split(",")[1] || "";
        setFileInfo({ name: file.name, kind: "image", mimeType: file.type, data: base64 });
        setStatus("idle");
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        setFileInfo({ name: file.name, kind: "text", data: String(reader.result || "") });
        setStatus("idle");
      };
      reader.readAsText(file);
    }
  }

  async function submit() {
    setStatus("sending");
    setResult(null);
    setErrorDetail("");

    const payload = {};
    if (mode === "text") {
      if (!text.trim()) { setStatus("idle"); return; }
      payload.text = text.trim();
    } else {
      if (!fileInfo) { setStatus("idle"); return; }
      if (fileInfo.kind === "image") payload.image = { mimeType: fileInfo.mimeType, data: fileInfo.data };
      else payload.text = fileInfo.data;
    }

    try {
      const res = await fetch("/api/ai/import-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorDetail(data.detail || data.error || s.genericError);
        return;
      }
      setResult({ reply: data.reply, actions: data.actions || [] });
      setStatus("done");
      setText("");
      resetFile();
    } catch {
      setStatus("error");
      setErrorDetail(s.genericError);
    }
  }

  const canSubmit = status !== "sending" && status !== "reading" && (mode === "text" ? text.trim().length > 0 : !!fileInfo);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted dark:text-moon-muted">{s.hint}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            mode === "text" ? "bg-lantern text-lantern-ink" : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"
          }`}
        >
          {s.typeIt}
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            mode === "file" ? "bg-lantern text-lantern-ink" : "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted"
          }`}
        >
          {s.uploadIt}
        </button>
      </div>

      {mode === "text" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={s.textPlaceholder}
          rows={6}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-sage"
        />
      ) : (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center gap-2 rounded-soft border-2 border-dashed border-black/15 dark:border-white/15 py-8 cursor-pointer hover:border-sage transition">
            <input ref={fileInputRef} type="file" accept="image/*,.txt,.csv" onChange={handleFile} className="hidden" />
            {fileInfo?.kind === "image" ? <ImageIcon size={22} className="text-sage dark:text-sage-soft" /> : <Upload size={22} className="text-sage dark:text-sage-soft" />}
            <span className="text-sm text-ink-muted dark:text-moon-muted">{fileInfo ? fileInfo.name : s.dropHint}</span>
          </label>
          <p className="text-xs text-ink-muted dark:text-moon-muted flex items-start gap-1.5">
            <FileText size={13} className="shrink-0 mt-0.5" /> {s.officeHint}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="inline-flex items-center gap-1.5 rounded-soft bg-lantern text-lantern-ink text-sm font-medium px-5 py-2.5 shadow-lantern hover:brightness-105 transition disabled:opacity-40"
      >
        {status === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {status === "sending" ? s.sending : s.submit}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorDetail}</p>
      )}

      {status === "done" && result && (
        <div className="rounded-card bg-sage/[0.06] dark:bg-sage/[0.1] border border-sage/20 p-4 space-y-2">
          <p className="text-sm whitespace-pre-wrap">{result.reply}</p>
          {result.actions?.length > 0 && (
            <p className="text-xs text-ink-muted dark:text-moon-muted">
              {s.addedCount.replace("{n}", result.actions.length)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
