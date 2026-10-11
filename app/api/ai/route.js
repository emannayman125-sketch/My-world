import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";

// Grounded content ideas: instead of asking Hamzawi to invent generic
// "5 tips" posts, this pulls a few real, recent facts from hubs he's
// actually active in (MBA, trading, business) and asks for ideas that
// reference something real he did -- so a suggestion is at minimum
// plausible, not fabricated from nothing. Existing content titles are
// passed along so it doesn't propose something already in the pipeline.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "ar";

  const [{ data: courses }, { data: assignments }, { data: trades }, { data: bizIdeas }, { data: existing }] = await Promise.all([
    supabase.from("mba_courses").select("name, progress").eq("user_id", user.id).order("progress", { ascending: false }).limit(3),
    supabase.from("mba_assignments").select("title, status").eq("user_id", user.id).eq("status", "submitted").order("created_at", { ascending: false }).limit(3),
    supabase.from("trading_journal").select("symbol, result").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("business_ideas").select("title, stage").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("content_items").select("title").eq("user_id", user.id).limit(20),
  ]);

  const facts = [];
  if (courses?.length) facts.push(`MBA courses in progress: ${courses.map((c) => `${c.name} (${c.progress}%)`).join(", ")}`);
  if (assignments?.length) facts.push(`Recently submitted assignments: ${assignments.map((a) => a.title).join(", ")}`);
  if (trades?.length) {
    const wins = trades.filter((t) => t.result === "win").length;
    facts.push(`Recent trades (last ${trades.length}): ${wins} wins, symbols include ${[...new Set(trades.map((t) => t.symbol))].slice(0, 5).join(", ")}`);
  }
  if (bizIdeas?.length) facts.push(`Business ideas he's exploring: ${bizIdeas.map((b) => `${b.title} (${b.stage})`).join(", ")}`);

  if (facts.length === 0) {
    // Nothing real to ground ideas in yet -- say so honestly instead of
    // inventing a life for him. The UI shows this as "no new ideas yet".
    return NextResponse.json({ suggestions: [] });
  }

  const existingTitles = (existing || []).map((e) => e.title).join(" | ") || "none yet";

  const system = `You help come up with LinkedIn/Facebook post ideas for someone's real, current activity. You are given a short list of real facts about what he's actually doing right now (his MBA courses, trading, business ideas) -- use ONLY these facts, never invent achievements, numbers, or experiences not given to you. A trading result is personal/sensitive: if you reference it, keep it general (e.g. "lessons from this week's trades") rather than stating specific P&L or win counts in the post idea itself.

Return JSON only: {"suggestions": [{"title": string, "hook": string, "platform": "linkedin"|"facebook"}, ...]} with 3 to 5 ideas. "title" is a short internal working title (not the post itself). "hook" is one compelling opening line/angle for the actual post, in ${locale === "ar" ? "Arabic" : "English"}. Don't repeat any idea whose title is close to one of these already in his pipeline: ${existingTitles}.`;

  const result = await callGemini(system, [{ role: "user", content: facts.join("\n") }], { jsonMode: true, maxTokens: 1024 });

  if (result.error) {
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: 502 });
  }

  let suggestions = [];
  try {
    const parsed = JSON.parse(result.text);
    suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 502 });
  }

  return NextResponse.json({ suggestions });
}
