import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { cairoNow, addDaysISO } from "@/lib/time";
import { pickQuote } from "@/lib/quotes/pickQuote";

// Push notification bodies get cut off by the OS well before this, but
// keep a hard ceiling so a long quote never breaks the payload.
const MAX_BODY = 160;
function clip(s, n) {
  const str = String(s || "").trim();
  return str.length > n ? str.slice(0, n - 1).trimEnd() + "…" : str;
}

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

  // Same deterministic "quote of the day" the dashboard card shows --
  // broadcast, so no per-user mood/personal-quote lookup here, just the
  // same quiet-evening theme everyone sees if they open the app now.
  const quote = pickQuote({ hour: TARGET_HOUR });
  const quoteLine = quote.isPersonal
    ? quote.text
    : quote.author
    ? `${quote.text} — ${quote.author}`
    : quote.text;

  const quotePayload = JSON.stringify({
    title: "عالمك الخاص 🌙",
    body: clip(quoteLine, MAX_BODY),
    url: "/dashboard",
  });

  // Tomorrow's appointments, per person: if there are any, the evening
  // notification says so (study blocks first) instead of the quote.
  const tomorrow = addDaysISO(1);
  const tomorrowByUser = {};
  const userIds = Array.from(new Set((subs || []).map((x) => x.user_id).filter(Boolean)));
  if (userIds.length) {
    const { data: evs } = await admin
      .from("events")
      .select("user_id, title, event_time, category")
      .in("user_id", userIds)
      .eq("event_date", tomorrow)
      .order("event_time", { ascending: true });
    for (const ev of evs || []) (tomorrowByUser[ev.user_id] = tomorrowByUser[ev.user_id] || []).push(ev);
  }
  function payloadFor(userId) {
    const list = tomorrowByUser[userId] || [];
    if (!list.length) return quotePayload;
    const sorted = [...list].sort((a, b) => (b.category === "دراسة") - (a.category === "دراسة"));
    const parts = sorted.slice(0, 3).map((ev) => {
      const t = ev.event_time ? ` ${String(ev.event_time).slice(0, 5)}` : "";
      return `${ev.category === "دراسة" ? "📚 " : ""}${ev.title}${t}`;
    });
    const more = list.length > 3 ? ` +${list.length - 3}` : "";
    return JSON.stringify({
      title: "بكرة عندك 🗓️",
      body: clip(parts.join(" · ") + more, MAX_BODY),
      url: "/tasks?tab=calendar",
    });
  }

  let sent = 0;
  let removed = 0;
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payloadFor(sub.user_id)
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
