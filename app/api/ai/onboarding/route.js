import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";
import { todayISO } from "@/lib/time";

// Onboarding: turns Ahmed's five free-form answers into a PROPOSED set of
// tasks, habits, goals and "currently" items. Like Brain Dump, this route never
// writes anything. The client shows the proposal and only what he keeps gets saved.

const PRIORITIES = ["high", "important", "normal"];
const PERIODS = ["weekly", "monthly"];
const CURRENTLY = ["listening", "watching", "reading"];
const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function sanitize(raw) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  const firstEmoji = (s) => {
    const m = String(s || "").match(/\p{Extended_Pictographic}/u);
    return m ? m[0] : "🔥";
  };
  return {
    tasks: arr(raw?.tasks)
      .map((t) => ({
        title: clip(t?.title, 90),
        priority: PRIORITIES.includes(t?.priority) ? t.priority : "normal",
        due_date: ISO.test(t?.due_date || "") ? t.due_date : null,
      }))
      .filter((t) => t.title)
      .slice(0, 8),
    habits: arr(raw?.habits)
      .map((h) => ({ name: clip(h?.name, 60), emoji: firstEmoji(h?.emoji) }))
      .filter((h) => h.name)
      .slice(0, 5),
    goals: arr(raw?.goals)
      .map((g) => ({ title: clip(g?.title, 100), period: PERIODS.includes(g?.period) ? g.period : "monthly" }))
      .filter((g) => g.title)
      .slice(0, 4),
    currently: arr(raw?.currently)
      .map((c) => ({ kind: CURRENTLY.includes(c?.kind) ? c.kind : null, title: clip(c?.title, 80) }))
      .filter((c) => c.kind && c.title)
      .slice(0, 6),
  };
}

export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const locale = body.locale === "en" ? "en" : "ar";
  const keys = ["study", "week", "daily", "goals", "into"];
  const answers = {};
  for (const k of keys) answers[k] = clip(body.answers?.[k], 900);

  if (!keys.some((k) => answers[k])) {
    return NextResponse.json({ error: "missing_answers" }, { status: 400 });
  }

  const system = `You help organize a person's new personal app from their own words.
Today's date is ${todayISO()}. Write titles in ${locale === "ar" ? "Arabic" : "English"}, keeping the person's own wording and staying short.

You get JSON with five free-text answers:
- study: what he is studying or starting soon, and when
- week: what must get done this week
- daily: small things he wants to do every day
- goals: what he is working toward this month
- into: what he is listening to, watching or reading lately

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "tasks":     [{ "title": string, "priority": "high"|"important"|"normal", "due_date": string|null }],
  "habits":    [{ "name": string, "emoji": string }],
  "goals":     [{ "title": string, "period": "weekly"|"monthly" }],
  "currently": [{ "kind": "listening"|"watching"|"reading", "title": string }]
}

Rules:
- Use ONLY what he actually said. Never invent tasks, habits, goals, titles or dates.
- "due_date" only if a specific day is stated or clearly implied (YYYY-MM-DD, using today's date to resolve words like "tomorrow" or "Friday"); otherwise null.
- tasks come mostly from "week" (and concrete dated items in "study"); habits from "daily" (and a study routine only if he described one); goals from "goals" (and a study aim if he stated one); currently from "into".
- "habits[].emoji" is one fitting emoji.
- Do not infer health, religious, financial or emotional details that he did not state. Do not add advice or commentary.
- Empty answers produce empty arrays.`;

  const res = await callGemini(system, [{ role: "user", content: JSON.stringify(answers) }], {
    jsonMode: true,
    maxTokens: 3072,
  });
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
