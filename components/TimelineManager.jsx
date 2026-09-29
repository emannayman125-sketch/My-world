"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import { signMemoryPhotos, isLegacyPublicUrl } from "@/lib/memoryPhotos";
import LinkField from "./LinkField";

export default function TimelineManager({ userId, initialMemories, strings }) {
  const tr = strings.legacy.timeline;
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [memories, setMemories] = useState(initialMemories || []);
  const [form, setForm] = useState({ year: new Date().getFullYear(), emoji: "✨", title: "", description: "", link_url: "" });
  const [uploadingFor, setUploadingFor] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({});

  useEffect(() => {
    const withPhotos = memories.filter((m) => m.image_url && !isLegacyPublicUrl(m.image_url));
    if (withPhotos.length === 0) return;
    let cancelled = false;
    signMemoryPhotos(supabase, withPhotos).then((map) => {
      if (!cancelled) setPhotoUrls((prev) => ({ ...prev, ...map }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memories.map((m) => m.image_url).join(",")]);

  async function addMemory(e) {
    e.preventDefault();
    if (!form.title.trim()) return;

    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: userId,
        year: form.year,
        emoji: form.emoji,
        title: form.title.trim(),
        description: form.description.trim() || null,
        link_url: form.link_url.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMemories((list) => [...list, data]);
      setForm({ ...form, title: "", description: "", link_url: "" });
    }
  }

  async function uploadPhoto(memory, file) {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingFor(memory.id);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${memory.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("memory-photos")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      // Store the storage PATH (bucket is private now, not a public URL).
      const bustUrl = path;
      await supabase.from("memories").update({ image_url: bustUrl }).eq("id", memory.id);
      setMemories((list) => list.map((m) => (m.id === memory.id ? { ...m, image_url: bustUrl } : m)));
    }

    setUploadingFor(null);
  }

  async function removeMemory(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("memories").delete().eq("id", id);
    setMemories((list) => list.filter((m) => m.id !== id));
  }

  const sorted = [...memories].sort((a, b) => a.year - b.year);

  return (
    <div className="space-y-4">
      <form onSubmit={addMemory} className="card p-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            className="w-24 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            className="w-14 text-center rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={tr.titlePlaceholder}
            className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={tr.descriptionPlaceholder}
            className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105">
            {tr.add}
          </button>
        </div>
        <input
          value={form.link_url}
          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
          placeholder={tr.linkPlaceholder}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
        />
      </form>

      <div className="relative border-e-2 border-black/10 dark:border-white/10 pe-6 space-y-6">
        {sorted.map((m) => (
          <div key={m.id} className="relative">
            <span className="absolute -end-[31px] top-1 w-4 h-4 rounded-full bg-sage" />
            <div className="card p-4 flex items-start gap-4">
              {m.image_url ? (
                isLegacyPublicUrl(m.image_url) ? (
                  <div className="w-20 h-20 rounded-soft bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] text-center text-ink-muted dark:text-moon-muted shrink-0 px-1">
                    {tr.photoUnavailable}
                  </div>
                ) : photoUrls[m.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrls[m.id]} alt={m.title} className="w-20 h-20 rounded-soft object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-soft bg-black/5 dark:bg-white/5 animate-pulse shrink-0" />
                )
              ) : (
                <label className="w-20 h-20 rounded-soft bg-black/5 dark:bg-white/5 flex items-center justify-center text-xs text-ink-muted dark:text-moon-muted shrink-0 cursor-pointer text-center px-1">
                  {uploadingFor === m.id ? tr.uploading : tr.addPhoto}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingFor === m.id}
                    onChange={(e) => uploadPhoto(m, e.target.files?.[0])}
                  />
                </label>
              )}
              <div className="flex-1">
                <p className="text-sm text-ink-muted dark:text-moon-muted">{m.year}</p>
                <p className="font-medium">{m.emoji} {m.title}</p>
                {m.description && <p className="text-sm text-ink-muted dark:text-moon-muted mt-1">{m.description}</p>}
                <LinkField url={m.link_url} />
              </div>
              <button onClick={() => removeMemory(m.id)} className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm shrink-0">
                {tr.delete}
              </button>
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noMemories}</p>
        )}
      </div>
    </div>
  );
}
