import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { todayISO, addDaysISO } from "@/lib/time";

// Marks one of today's pending Daily Brief suggestions as dismissed, so it
// stops showing on Home and drops out of the Suggestions inbox. It never
// touches anything already accepted (that's a real task now, not a suggestion).
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title } = await request.json().catch(() => ({}));
  if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });

  // Same safe-window + precise-day-filter approach as the reconciler, so a
  // suggestion created just after Cairo midnight is never missed.
  const today = todayISO();
  const safeWindowStart = `${addDaysISO(-1)}T00:00:00.000Z`;
  const { data: candidates } = await supabase
    .from("ai_suggestions")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("source", "daily_brief")
    .eq("title", title)
    .eq("status", "pending")
    .gte("created_at", safeWindowStart);

  const todaysRow = (candidates || []).find((r) => todayISO(new Date(r.created_at)) === today);
  if (todaysRow) {
    await supabase.from("ai_suggestions").update({ status: "dismissed" }).eq("id", todaysRow.id);
  }

  return NextResponse.json({ ok: true });
}
