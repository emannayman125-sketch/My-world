"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";

const KIND_EMOJI = { journal: "📝", treasure: "⭐", note: "💡", quote: "💭", learned: "🧠" };
const KIND_KEYS = Object.keys(KIND_EMOJI);

export default function JournalManager({ userId, initialNotes, strings }) {
  const tr = strings.legacy.journal;
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [notes, setNotes] = useState(initialNotes || []);
  const [kind, setKind] = useState("journal");
  const [content, setContent] = useState("");
  const [uploadingFor, setUploadingFor] = useState(null);

  async function addNote(e) {
    e.preventDefault();
    if (!content.trim()) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId, kind, content: content.trim() })
      .select()
      .single();

    if (!error && data) {
      setNotes((list) => [data, ...list]);
      setContent("");
    }
  }

  async function uploadPhoto(note, file) {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingFor(note.id);

    const ext = file.name.split(".").pop();
    const path = `${userId}/note-${note.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("memory-photos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("memory-photos").getPublicUrl(path);
      const bustUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("notes").update({ image_url: bustUrl }).eq("id", note.id);
      setNotes((list) => list.map((n) => (n.id === note.id ? { ...n, image_url: bustUrl } : n)));
    }

    setUploadingFor(null);
  }

  async function removeNote(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("notes").delete().eq("id", id);
    setNotes((list) => list.filter((n) => n.id !== id));
  }

  const visible = notes.filter((n) => n.kind === kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {KIND_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setKind(key)}
            className={`rounded-full px-4 py-2 text-sm transition
              ${kind === key ? "bg-lantern text-night" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"}`}
          >
            {KIND_EMOJI[key]} {tr.kinds[key]}
          </button>
        ))}
      </div>

      {kind === "treasure" && (
        <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.treasureHint}</p>
      )}

      <form onSubmit={addNote} className="card p-4">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={tr.writePlaceholder.replace("{kind}", tr.kinds[kind])}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern mb-2"
        />
        <div className="flex justify-end">
          <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105">
            {tr.save}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noItems}</p>
        )}
        {visible.map((note) => (
          <div key={note.id} className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="leading-7 whitespace-pre-wrap">{note.content}</p>
              <button onClick={() => removeNote(note.id)} className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm shrink-0">
                {tr.delete}
              </button>
            </div>

            {kind === "treasure" && (
              note.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={note.image_url} alt="" className="w-full max-w-xs rounded-soft object-cover" />
              ) : (
                <label className="inline-block text-xs rounded-full bg-black/5 dark:bg-white/5 px-3 py-1.5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10">
                  {uploadingFor === note.id ? tr.uploading : tr.addPhoto}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingFor === note.id}
                    onChange={(e) => uploadPhoto(note, e.target.files?.[0])}
                  />
                </label>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
