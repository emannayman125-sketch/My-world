import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { cairoNow } from "@/lib/time";

// Vercel Hobby plan only allows one daily cron trigger at a fixed UTC
// time (see vercel.json), so this runs once a day already -- the
// cairoNow() guard below is just a safety net, not the real schedule.
const TARGET_HOUR = 20; // 8pm Cairo

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { hour } = cairoNow();
  if (Math.abs(hour - TARGET_HOUR) > 1) {
    // Guards against a misconfigured or re-run trigger firing at the
    // wrong time of day; harmless no-op otherwise.
    return NextResponse.json({ skipped: "not_evening", hour });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!serviceKey || !vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "missing_config" }, { status: 500 });
  }

  webpush.setVapidDetails("mailto:hello@ahmedsworld.app", vapidPublic, vapidPrivate);

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: subs } = await admin.from("push_subscriptions").select("*");

  const payload = JSON.stringify({
    title: "عالمك الخاص",
    body: "راجعت يومك النهاردة؟ 🌙",
    url: "/tasks",
  });

  let sent = 0;
  let removed = 0;
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload
      );
      sent++;
    } catch (err) {
      // 404/410 = the browser dropped this subscription on its own
      // (uninstalled, cleared data, etc.) -- clean up the stale row.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
        removed++;
      }
    }
  }

  return NextResponse.json({ sent, removed, total: (subs || []).length });
}
