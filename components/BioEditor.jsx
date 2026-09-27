"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function BioEditor({ userId, initialBio }) {
  const supabase = createClient();
  const [bio, setBio] = useState(initialBio || "");
  const [saved, setSaved] = useState(true);

  async function handleSave() {
    await supabase.from("profiles").update({ bio }).eq("id", userId);
    setSaved(true);
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl mb-3">👤 عني</h2>
      <textarea
        value={bio}
        onChange={(e) => { setBio(e.target.value); setSaved(false); }}
        rows={6}
        placeholder="اكتب هنا نبذة عنك: شغلك، اهتماماتك، أهدافك، أي حاجة تحب إنها تكون هنا..."
        className="w-full rounded-soft border border-black/10 dark:border-white/10
                   bg-transparent px-4 py-3 text-sm outline-none focus:border-lantern leading-7"
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={saved}
          className="rounded-soft bg-lantern text-night text-sm px-5 py-2
                     hover:brightness-105 transition disabled:opacity-50"
        >
          {saved ? "محفوظ" : "حفظ"}
        </button>
      </div>
    </div>
  );
}
