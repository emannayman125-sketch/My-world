"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import AvatarUpload from "./AvatarUpload";

export default function ProfileSettings({ userId, initialProfile }) {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || "");
  const [displayNameEn, setDisplayNameEn] = useState(initialProfile?.display_name_en || "");
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [isBioPublic, setIsBioPublic] = useState(initialProfile?.is_bio_public ?? false);
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("");
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        display_name_en: displayNameEn.trim() || null,
        username: cleanUsername || null,
        is_bio_public: isBioPublic,
      })
      .eq("id", userId);

    if (error) {
      setStatus(cleanUsername ? "اسم المستخدم ده محجوز، جرّب اسم تاني." : "حصلت مشكلة في الحفظ.");
    } else {
      setUsername(cleanUsername);
      setStatus("تم الحفظ ✓");
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-display text-xl">الملف الشخصي</h2>

      <AvatarUpload userId={userId} initialUrl={initialProfile?.avatar_url} />

      <div>
        <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">الاسم اللي يظهر في التحية</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">
          الاسم بالإنجليزي (اختياري — يظهر بس لما الموقع يبقى بالإنجليزي)
        </label>
        <input
          value={displayNameEn}
          onChange={(e) => setDisplayNameEn(e.target.value)}
          placeholder="Ahmed"
          dir="ltr"
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink-muted dark:text-moon-muted">
          رابط الصفحة العامة (username) — اختياري، بيسمح بمشاركة رابط بدون تسجيل دخول
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted dark:text-moon-muted">/u/</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mo7amed"
            className="flex-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-muted dark:text-moon-muted">
        <input type="checkbox" checked={isBioPublic} onChange={(e) => setIsBioPublic(e.target.checked)} />
        اعرض البايو في الصفحة العامة
      </label>

      <div className="flex items-center justify-between">
        {status && <span className="text-sm text-dusk">{status}</span>}
        <button onClick={save} className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105">
          حفظ
        </button>
      </div>
    </div>
  );
}
