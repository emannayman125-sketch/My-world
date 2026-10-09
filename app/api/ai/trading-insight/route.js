import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";

// Raises the serverless function's time ceiling as far as the hosting plan allows (Hobby still hard-caps at 10s; this is a no-op there, but matters if/when the plan changes).
export const maxDuration = 30;


// Hamzawi reads back his OWN logged data and reflects patterns to him —
// never advice, never predictions, never "buy/sell". Pure reflection:
// "Understand the trader", not "run the trades". On-demand only.
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "ar";

  const [{ data: dayNotes }, { data: trades }] = await Promise.all([
    supabase.from("trading_day_notes").select("note_date, net_pnl, trade_count, feeling, followed_rules").eq("user_id", user.id).order("note_date", { ascending: false }).limit(30),
    supabase.from("trading_journal").select("symbol, direction, result, pnl, fees, trade_date").eq("user_id", user.id).order("trade_date", { ascending: false }).limit(50),
  ]);

  const daysLogged = (dayNotes || []).length;
  const tradesLogged = (trades || []).length;
  if (daysLogged < 3 && tradesLogged < 5) {
    return NextResponse.json({ insight: null, reason: "not_enough_data" });
  }

  const system = `You are Hamzawi, reflecting a scalper's OWN logged data back to him — nothing more. He trades on a separate real platform; this app only holds his self-reported day notes and optional trade logs.

Write in ${locale === "ar" ? "natural, direct Egyptian Arabic" : "plain, direct English"}.

Return ONLY valid JSON (no markdown fences, no extra text):
{ "observations": [string, string, string] }

Hard rules:
- 2 to 3 short observations, each one sentence, max ~140 characters.
- Base every observation ONLY on patterns actually present in the data given (e.g. a feeling tag correlating with net P&L, a day he marked not following his rules, a symbol or direction appearing often in losses). Never invent a number or pattern that isn't really there.
- NEVER give trading advice, predictions, buy/sell suggestions, or strategy recommendations. You are describing his own past record, not telling him what to do next.
- If the data is too thin for a real pattern, say so plainly in one observation instead of forcing one.
- No emojis, no markdown.`;

  const payload = { day_notes: dayNotes || [], trades: trades || [] };
  const res = await callGemini(system, [{ role: "user", content: JSON.stringify(payload) }], { jsonMode: true, maxTokens: 1024 });
  if (!res || res.error || !res.text) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
    const observations = Array.isArray(parsed?.observations)
      ? parsed.observations.map((o) => clip(o, 180)).filter(Boolean).slice(0, 3)
      : [];
    if (observations.length === 0) return NextResponse.json({ insight: null, reason: "bad_ai_output" });
    return NextResponse.json({ insight: observations });
  } catch {
    return NextResponse.json({ error: "bad_ai_output" }, { status: 502 });
  }
}
