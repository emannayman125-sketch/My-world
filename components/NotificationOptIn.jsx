"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Entirely opt-in: nothing subscribes on its own. One evening reminder
// a day at most ("did you review your day today?") -- never more than
// that without Ahmed explicitly asking for more later.
export default function NotificationOptIn({ userId }) {
  const supabase = createClient();
  const [status, setStatus] = useState("checking"); // checking | unsupported | off | on
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    });
  }, []);

  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("محتاجين إذنك من المتصفح عشان نقدر نبعتلك تذكيرات.");
        setBusy(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const { error: insertError } = await supabase.from("push_subscriptions").insert({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth_key: json.keys.auth,
      });
      if (insertError) {
        // The browser subscribed but the server has no row for it, so no
        // reminder would ever actually arrive -- undo the browser side too
        // instead of showing "on" for something that silently can't work.
        await sub.unsubscribe();
        setError("حصلت مشكلة في تفعيل التذكيرات. جرب تاني.");
        setBusy(false);
        return;
      }
      setStatus("on");
    } catch {
      setError("حصلت مشكلة في تفعيل التذكيرات. جرب تاني.");
    }
    setBusy(false);
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { error: deleteError } = await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        if (deleteError) {
          setError("حصلت مشكلة في إيقاف التذكيرات. جرب تاني.");
          setBusy(false);
          return;
        }
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("حصلت مشكلة في إيقاف التذكيرات. جرب تاني.");
    }
    setBusy(false);
  }

  if (status === "unsupported") {
    return <p className="text-xs text-ink-muted dark:text-moon-muted">التذكيرات مش متاحة على المتصفح/الجهاز ده.</p>;
  }
  if (status === "checking") return null;

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>تذكير مسائي بسيط ("راجعت يومك النهاردة؟") — مرة واحدة بس في اليوم</span>
        <input
          type="checkbox"
          checked={status === "on"}
          disabled={busy}
          onChange={(e) => (e.target.checked ? subscribe() : unsubscribe())}
          className="accent-sage w-4 h-4"
        />
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
