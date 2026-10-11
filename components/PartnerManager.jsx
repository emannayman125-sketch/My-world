"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "./ToastProvider";
import { useConfirm } from "./ConfirmProvider";

export default function PartnerManager({ userId, link, otherProfile }) {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(userId);
    showToast("تم نسخ الكود — ابعته لشريكك عشان يحطه هو");
  }

  async function sendRequest(e) {
    e.preventDefault();
    const targetId = code.trim();
    if (!targetId || targetId === userId) return;

    setBusy(true);
    const { error } = await supabase
      .from("partner_links")
      .insert({ user_a: targetId, user_b: userId, status: "pending" });

    setBusy(false);
    if (error) {
      showToast("الكود غلط أو مش شغال. اتأكدي إنه منسوخ صح.");
    } else {
      showToast("تم إرسال طلب الربط ✓ في انتظار موافقته");
      router.refresh();
    }
  }

  async function approve() {
    setBusy(true);
    const { error } = await supabase
      .from("partner_links")
      .update({ status: "accepted" })
      .eq("id", link.id);
    setBusy(false);
    if (!error) {
      showToast("تم الربط ✓");
      router.refresh();
    }
  }

  async function reject() {
    setBusy(true);
    const { error } = await supabase.from("partner_links").delete().eq("id", link.id);
    setBusy(false);
    if (error) { showToast("حصلت مشكلة، جرّب تاني."); return; }
    router.refresh();
  }

  async function disconnect() {
    if (!(await confirm("متأكدة إنك عايزة تفصلي الشراكة؟"))) return;
    setBusy(true);
    const { error } = await supabase.from("partner_links").delete().eq("id", link.id);
    setBusy(false);
    if (error) { showToast("حصلت مشكلة، جرّب تاني."); return; }
    router.refresh();
  }

  // حالة: مفيش أي طلب أو ربط لسه
  if (!link) {
    return (
      <div className="card p-6 space-y-4">
        <h2 className="font-display text-xl">اربط حسابك مع شخص تاني</h2>
        <p className="text-sm text-ink-muted dark:text-moon-muted">
          اربطي حسابك بحساب شخص تاني عشان تشوفوا تقدم بعض في المهام/الأهداف اللي تحددوها كـ "مشتركة".
          الربط مايكونش فعّال إلا لما الطرف التاني يوافق بنفسه.
        </p>

        <div>
          <p className="text-sm mb-1 text-ink-muted dark:text-moon-muted">كودك (ابعته لشريكك):</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={userId}
              className="flex-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-xs outline-none"
            />
            <button onClick={copyCode} className="rounded-soft bg-black/5 dark:bg-white/5 text-sm px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10">
              نسخ
            </button>
          </div>
        </div>

        <form onSubmit={sendRequest} className="space-y-2">
          <p className="text-sm text-ink-muted dark:text-moon-muted">أو حطي كود شريكك هنا:</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="كود شريكك"
              className="flex-1 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105 disabled:opacity-50"
            >
              إرسال طلب
            </button>
          </div>
        </form>
      </div>
    );
  }

  // حالة: أنا اللي طلبت، ولسه مستني موافقة التاني
  if (link.status === "pending" && link.user_b === userId) {
    return (
      <div className="card p-6 space-y-3">
        <h2 className="font-display text-xl">في انتظار الموافقة</h2>
        <p className="text-sm text-ink-muted dark:text-moon-muted">
          طلبك لـ {otherProfile?.display_name || "الطرف التاني"} لسه مستني موافقته.
        </p>
        <button onClick={reject} disabled={busy} className="text-sm text-ink-muted dark:text-moon-muted hover:text-red-500">
          إلغاء الطلب
        </button>
      </div>
    );
  }

  // حالة: حد بعتلي طلب وأنا اللي أوافق
  if (link.status === "pending" && link.user_a === userId) {
    return (
      <div className="card p-6 space-y-3">
        <h2 className="font-display text-xl">طلب ربط جديد</h2>
        <div className="flex items-center gap-3">
          {otherProfile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherProfile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">🙂</div>
          )}
          <span className="font-medium">{otherProfile?.display_name || "شخص"} عايز يربط حسابه بيك</span>
        </div>
        <div className="flex gap-2">
          <button onClick={approve} disabled={busy} className="rounded-soft bg-lantern text-night text-sm px-4 py-2 hover:brightness-105">
            موافقة
          </button>
          <button onClick={reject} disabled={busy} className="rounded-soft bg-black/5 dark:bg-white/5 text-sm px-4 py-2 hover:bg-black/10 dark:hover:bg-white/10">
            رفض
          </button>
        </div>
      </div>
    );
  }

  // حالة: متصلين بالفعل
  return (
    <div className="card p-6 space-y-3">
      <h2 className="font-display text-xl">مرتبط مع</h2>
      <div className="flex items-center gap-3">
        {otherProfile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={otherProfile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">🙂</div>
        )}
        <span className="font-medium">{otherProfile?.display_name || "شريكك"}</span>
      </div>
      <button onClick={disconnect} disabled={busy} className="text-sm text-ink-muted dark:text-moon-muted hover:text-red-500">
        فصل الشراكة
      </button>
    </div>
  );
}
