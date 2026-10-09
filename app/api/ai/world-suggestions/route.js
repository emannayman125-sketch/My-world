import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";

// Raises the serverless function's time ceiling as far as the hosting plan allows (Hobby still hard-caps at 10s; this is a no-op there, but matters if/when the plan changes).
export const maxDuration = 30;


// Suggests new books/shows/podcasts/music/places/hobbies from what he has
// already told the app he's into (interests, "my world", "currently").
// NEVER reads the journal or any other private hub. Propose-only: nothing
// is saved here, the client adds a suggestion only when he taps it.

const KINDS = ["music", "movie", "podcast", "book", "place", "hobby"];
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

function sanitize(raw) {
  const arr = Array.isArray(raw?.suggestions) ? raw.suggestions : [];
  return arr
    .map((s) => ({
      kind: KINDS.includes(s?.kind) ? s.kind : null,
      title: clip(s?.title, 100),
      subtitle: clip(s?.subtitle, 140),
      reason: clip(s?.reason, 130),
    }))
    .filter((s) => s.kind && s.title)
    .slice(0, 6);
}

export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "ar";
  const exclude = Array.isArray(body.exclude) ? body.exclude.map((t) => clip(t, 100)) : [];

  const [{ data: interests }, { data: worldItems }, { data: currently }] = await Promise.all([
    supabase.from("interests").select("category, value").eq("user_id", user.id),
    supabase.from("world_items").select("kind, title, subtitle, status").eq("user_id", user.id),
    supabase.from("currently_items").select("kind, title, subtitle").eq("user_id", user.id),
  ]);

  const taste = { interests: interests || [], my_world: worldItems || [], currently: currently || [] };
  const hasAnyTaste = taste.interests.length + taste.my_world.length + taste.currently.length > 0;
  if (!hasAnyTaste) {
    return NextResponse.json({ suggestions: [], reason: "no_taste_data" });
  }

  const system = `You suggest new things for a person to explore, based ONLY on their own stated tastes below (their interests, what's in their "My World" list, and what they're currently into). Never anything else about them.
Write in ${locale === "ar" ? "natural, warm Egyptian Arabic" : "plain, warm English"}.

Return ONLY valid JSON (no markdown fences, no extra text):
{ "suggestions": [{ "kind": "music"|"movie"|"podcast"|"book"|"place"|"hobby", "title": string, "subtitle": string, "reason": string }] }

Rules:
- 4 to 6 suggestions, spread across a few different kinds that make sense given his taste (don't force all 6 kinds if his data only supports 2 or 3).
- Every suggestion must be something real and well-known enough to be a safe, confident recommendation. Do not invent titles. If you're not confident something real exists, leave it out rather than guess.
- Never repeat something already in his lists, and never suggest anything in this exclude list: ${JSON.stringify(exclude)}.
- "reason" is one short sentence connecting it to something specific he already listed (e.g. "since you liked X").
- "subtitle" is a brief descriptor (artist/author/host/genre/location), not a review.
- Do not suggest anything violent, sexual, or otherwise inappropriate. Keep it tasteful and mainstream.`;

  const res = await callGemini(system, [{ role: "user", content: JSON.stringify(taste) }], { jsonMode: true, maxTokens: 2048 });
  if (!res || res.error || !res.text) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
    return NextResponse.json({ suggestions: sanitize(parsed) });
  } catch {
    return NextResponse.json({ error: "bad_ai_output" }, { status: 502 });
  }
}
