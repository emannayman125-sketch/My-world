"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function AvatarUpload({ userId, initialUrl }) {
  const supabase = createClient();
  const [url, setUrl] = useState(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("لازم تكون صورة.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("الصورة لازم تكون أصغر من 5 ميجا.");
      return;
    }

    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      setError("حصلت مشكلة في الرفع.");
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    // نضيف timestamp عشان المتصفح ما يعرضش نسخة قديمة محفوظة (cache)
    const bustUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: bustUrl }).eq("id", userId);

    setUrl(bustUrl);
    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="الصورة الشخصية" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🙂</span>
        )}
      </div>
      <div>
        <label className="rounded-soft bg-black/5 dark:bg-white/5 text-sm px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer inline-block">
          {uploading ? "جاري الرفع..." : "تغيير الصورة"}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
