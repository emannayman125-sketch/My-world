import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";

// Turns a bare content idea into a working draft: a sharper hook, a few
// title options, an outline, and a starter script. Propose-only — like
// Brain Dump and onboarding, nothing is written to content_items until
// the person reviews it and hits save on the client.

const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

function sanitize(raw) {
  const titles = Array.isArray(raw?.titles) ? raw.titles.map((t) => clip(t, 90)).filter(Boolean).slice(0, 3) : [];
  return {
    hook: clip(raw?.hook, 200),
    titles,
    outline: clip(raw?.outline, 2000),
    script: clip(raw?.script, 4000),
    thumbnail_idea: clip(raw?.thumbnail_idea, 150),
  };
}

export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = clip(body.title, 200);
  const hook = clip(body.hook, 300);
  const platform = clip(body.platform, 30) || "other";
  const locale = body.locale === "en" ? "en" : "ar";
  if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });

  const platformNote = {
    youtube: "a YouTube video, a few minutes long",
    podcast: "a podcast episode, spoken and conversational",
    instagram: "a short Instagram video (Reel), under 60 seconds",
    tiktok: "a short TikTok video, under 60 seconds",
    linkedin: "a LinkedIn post or short video, professional tone",
    other: "a piece of content",
  }[platform] || "a piece of content";

  const system = `You help a content creator turn a bare idea into a working first draft, for ${platformNote}.
Write in ${locale === "ar" ? "natural, conversational Egyptian Arabic" : "plain, conversational English"}.

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "hook": string,
  "titles": [string, string, string],
  "outline": string,
  "script": string,
  "thumbnail_idea": string
}

Rules:
- "hook": one punchy opening line/sentence that would make someone stop scrolling. If he already gave a hook, sharpen it rather than replacing its idea.
- "titles": exactly 3 short, distinct title options for this piece.
- "outline": 4 to 8 short bullet-style lines (one idea per line, no numbering needed), covering the piece's structure start to finish.
- "script": a genuine first-draft script or talking-through of the outline, written as something he could read or riff from out loud. Match the format to the platform (short and punchy for Reels/TikTok, longer and structured for YouTube/podcast).
- "thumbnail_idea": one concrete visual concept for a thumbnail or cover image.
- Base everything on the title/hook given. Do not invent facts, data, quotes, or claims about him. No emojis, no markdown formatting inside the strings.`;

  const userMsg = JSON.stringify({ title, hook: hook || null, platform });
  const res = await callGemini(system, [{ role: "user", content: userMsg }], { jsonMode: true, maxTokens: 3072 });
  if (!res || res.error || !res.text) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(res.text.replace(/```json|```/g, "").trim());
    return NextResponse.json(sanitize(parsed));
  } catch {
    return NextResponse.json({ error: "bad_ai_output" }, { status: 502 });
  }
}
