import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { todayISO } from "@/lib/time";

// Accepting a pending suggestion performs the real action it stands for
// (currently: a daily-brief task suggestion becomes a real top-3 item for
// today) and marks it accepted. Dismissing just marks it dismissed.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, action } = await request.json().catch(() => ({}));
  if (!id || !["accept", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("ai_suggestions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (action === "dismiss") {
    await supabase.from("ai_suggestions").update({ status: "dismissed" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  // action === "accept"
  if (row.source === "daily_brief" && row.kind === "task") {
    const { count } = await supabase
      .from("top3_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("for_date", todayISO());
    if ((count || 0) >= 3) {
      return NextResponse.json({ error: "top3_full" }, { status: 409 });
    }
    await supabase.from("top3_tasks").insert({ user_id: user.id, title: row.title, for_date: todayISO() });
  }

  await supabase.from("ai_suggestions").update({ status: "accepted" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
