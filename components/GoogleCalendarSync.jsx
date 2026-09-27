"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "./ToastProvider";

function buildEventBody(ev) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (ev.event_time) {
    const start = `${ev.event_date}T${ev.event_time}:00`;
    const startDate = new Date(start);
    const end = new Date(startDate.getTime() + 60 * 60 * 1000);
    return {
      summary: ev.title,
      description: ev.notes || "",
      start: { dateTime: start, timeZone },
      end: { dateTime: end.toISOString().slice(0, 19), timeZone },
    };
  }

  const next = new Date(ev.event_date);
  next.setDate(next.getDate() + 1);
  return {
    summary: ev.title,
    description: ev.notes || "",
    start: { date: ev.event_date },
    end: { date: next.toISOString().slice(0, 10) },
  };
}

export default function GoogleCalendarSync({ events, onSynced }) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [scriptReady, setScriptReady] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    if (document.getElementById("gsi-script")) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!scriptReady || !window.google || !clientId) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: (response) => {
        if (response?.access_token) {
          setAccessToken(response.access_token);
          showToast("تم الربط مع Google Calendar ✓");
        }
      },
    });
    setTokenClient(client);
  }, [scriptReady, clientId, showToast]);

  async function syncNow() {
    if (!accessToken) return;
    setSyncing(true);

    const unsynced = events.filter((e) => !e.google_event_id);
    let count = 0;

    for (const ev of unsynced) {
      try {
        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildEventBody(ev)),
        });
        const data = await res.json();
        if (data.id) {
          await supabase.from("events").update({ google_event_id: data.id }).eq("id", ev.id);
          count++;
        }
      } catch {
        // نكمل الباقي حتى لو حدث واحد فشل
      }
    }

    setSyncing(false);
    onSynced?.();
    showToast(count > 0 ? `تم رفع ${count} موعد لـ Google Calendar ✓` : "كل المواعيد متزامنة بالفعل.");
  }

  if (!clientId) return null;

  return (
    <div className="flex items-center gap-2">
      {!accessToken ? (
        <button
          onClick={() => tokenClient?.requestAccessToken()}
          disabled={!tokenClient}
          className="text-xs rounded-full bg-black/5 dark:bg-white/5 px-3 py-1.5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
        >
          🔗 ربط مع Google Calendar
        </button>
      ) : (
        <button
          onClick={syncNow}
          disabled={syncing}
          className="text-xs rounded-full bg-dusk/15 text-dusk px-3 py-1.5 hover:bg-dusk/25 disabled:opacity-50"
        >
          {syncing ? "بيزامن..." : "🔄 مزامنة الآن"}
        </button>
      )}
    </div>
  );
}
