import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";

// Raises the serverless function's time ceiling as far as the hosting plan allows (Hobby still hard-caps at 10s; this is a no-op there, but matters if/when the plan changes).
export const maxDuration = 30;


// Summarizes an English-practice conversation into structured progress
// data. Like Brain Dump, this ONLY extracts -- it never saves anything
// itself. The client shows the summary for Ahmed to confirm/edit first.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { messages } = await request.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "missing_messages" }, { status: 400 });
  }

  const transcript = messages.map((m) => `${m.role === "user" ? "Ahmed" : "Hamzawi"}: ${m.content}`).join("\n");

  const systemPrompt = `You review an English-practice conversation between Ahmed and his AI tutor "Hamzawi" and extract a short learning summary.

Return ONLY valid JSON, no markdown fences, matching exactly:
{
  "topic": string (a short 3-6 word description of what was practiced),
  "vocabulary": [{ "word": string, "meaning": string }] (new words/phrases Ahmed used or was taught, max 8),
  "mistakes": [{ "mistake": string, "correction": string }] (real grammar/word-choice mistakes Ahmed made and the correction, max 6),
  "self_rating": number (1-5, your honest read of how well Ahmed communicated this session, 5 = excellent),
  "encouragement": string (one warm, specific sentence -- not generic praise)
}

If there weren't really any mistakes, return an empty array for mistakes. Never invent vocabulary or mistakes that didn't appear in the conversation.`;

  const result = await callGemini(systemPrompt, [{ role: "user", content: transcript }], { jsonMode: true });

  if (result.error) {
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: 502 });
  }

  let parsed;
  try {
    const cleaned = result.text.trim().replace(/^```json\s*|```$/g, "");
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "parse_failed" }, { status: 502 });
  }

  return NextResponse.json({
    topic: parsed.topic || "",
    vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    self_rating: Number(parsed.self_rating) || 3,
    encouragement: parsed.encouragement || "",
  });
}
