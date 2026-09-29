import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";
import { todayISO } from "@/lib/time";

// This route ONLY extracts structure from free text -- it never writes
// to the database itself. The client shows the extracted items for
// Ahmed to confirm/edit, then saves them with the normal client-side
// Supabase calls (same as every other form in the app). Nothing is
// ever created silently.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { text, locale = "ar" } = await request.json();
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }

  const today = todayISO();
  const lang = locale === "ar" ? "Arabic" : "English";

  const systemPrompt = `You extract structured items from a person's free-form brain dump text.

Today's date is ${today}. Write the "title" fields in ${lang} (translate/keep the person's own words, don't add commentary).

Return ONLY valid JSON, no markdown fences, no extra text, matching this exact shape:
{
  "tasks": [{ "title": string, "due_date": string|null (YYYY-MM-DD if a date/day was mentioned, else null), "priority": "high"|"medium"|"low" }],
  "notes": [{ "title": string, "kind": "idea"|"reminder"|"study" }]
}

Rules:
- A task is a concrete action with a clear "do this" verb (call, finish, review, buy, submit...).
- A "note" with kind "idea" is a loose idea/thought, not an action.
- A "note" with kind "reminder" is something to remember but not a task with a clear deadline.
- A "note" with kind "study" is something to learn/study/practice.
- If nothing fits a category, return an empty array for it.
- Do not invent items that weren't mentioned. Split compound sentences into separate items.`;

  const result = await callGemini(systemPrompt, [{ role: "user", content: text }], { jsonMode: true });

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
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
  });
}
