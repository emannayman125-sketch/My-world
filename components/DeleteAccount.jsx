"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Destructive and irreversible, so it's gated behind typing a literal
// confirmation word -- not just a click -- on top of the real auth
// check the API route itself does server-side.
export default function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const CONFIRM_WORD = "امسح";

  async function handleDelete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "حصلت مشكلة أثناء الحذف. جرب تاني أو قولنا.");
        setBusy(false);
        return;
      }
      router.push("/login");
    } catch {
      setError("حصلت مشكلة أثناء الحذف. جرب تاني أو قولنا.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="card p-6 space-y-2 border border-red-500/20">
        <h2 className="font-display text-xl">⚠️ منطقة خطرة</h2>
        <p className="text-sm text-ink-muted dark:text-moon-muted">
          حذف حسابك هيمسح كل حاجة نهائيًا — المهام، اليوميات، الذكريات، كل الأقسام. مفيش رجوع بعد كده.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-red-500 underline"
        >
          عايز أمسح حسابي نهائيًا
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-3 border border-red-500/30">
      <h2 className="font-display text-xl">⚠️ تأكيد الحذف النهائي</h2>
      <p className="text-sm text-ink-muted dark:text-moon-muted">
        ده مش رجّاع. هيتمسح كل حاجة فعليًا بما فيها الصور والنسخ الاحتياطية.
        اكتب كلمة <span className="font-medium text-ink dark:text-moon">«{CONFIRM_WORD}»</span> تحت عشان تأكد.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        dir="rtl"
        className="w-full rounded-soft border border-red-500/30 bg-transparent px-3 py-2 text-sm outline-none focus:border-red-500"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button
          disabled={confirmText !== CONFIRM_WORD || busy}
          onClick={handleDelete}
          className="rounded-soft bg-red-500 text-white text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 transition"
        >
          {busy ? "جاري الحذف..." : "امسح حسابي نهائيًا"}
        </button>
        <button
          onClick={() => { setOpen(false); setConfirmText(""); setError(""); }}
          className="text-sm text-ink-muted dark:text-moon-muted"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}
