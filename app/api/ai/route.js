import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGeminiWithTools } from "@/lib/ai/gemini";
import { AGENT_TOOLS, makeAgentExecutor } from "@/lib/ai/agentTools";

// Raises the serverless function's time ceiling as far as the hosting plan
// allows (a plan import can need many tool calls -- more than a normal chat
// turn -- so it benefits the most from this of any AI route).
export const maxDuration = 30;

// "Give Hamzawi your plan and let him sort it out": he reads a plan however
// it comes in -- typed out, a photo of a handwritten/printed schedule, or
// pasted text copied from a Word/Excel file -- and turns it into real tasks,
// goals, and habits using the exact same tools (and the same safety limits:
// no deletes, nothing outside the app) as the regular Hamzawi chat.
//
// Scope note: a real .docx/.xlsx file isn't parsed server-side here -- doing
// that reliably needs new parsing dependencies this sandbox can't verify
// build cleanly on Vercel before this ships, so for now the client extracts
// text from an Office file before sending it (or the person pastes it
// directly), while an image is sent to Gemini's vision input as-is.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const image = body.image && body.image.mimeType && body.image.data ? body.image : null;
  const locale = body.locale === "en" ? "en" : "ar";

  if (!text && !image) return NextResponse.json({ error: "missing_plan" }, { status: 400 });

  const system = `You are Hamzawi. He just handed you his personal plan/routine (as text, or as a photo of something he wrote or printed) and wants it turned into real items in his app -- not just discussed.

Read everything carefully -- it may mix a weekly schedule, habits he wants to keep, and longer-term goals in no particular order or structure, possibly handwritten and partly unclear.

Call tools for EVERY distinct item you can identify:
- A one-off or recurring to-do → add_task
- A habit he wants to track daily (exercise, reading, prayer times, etc.) → add_habit
- A weekly or monthly goal/target → add_goal (pick the closer-fitting period)

Call the tool once per distinct item -- a plan can reasonably have 10-20 items, don't stop early and don't merge different items into one call. Skip anything you genuinely can't read or that isn't actionable (e.g. a vague mood note) rather than guessing at it. If a date is implied, include it; if not, omit it rather than inventing one.

Language: reply in ${locale === "ar" ? "natural, warm Egyptian Arabic" : "plain, warm English"}.

After acting, give a short summary (3-5 sentences) grouped by what you added: "X tasks, Y habits, Z goals", naming a few examples by title. If you skipped anything, say so briefly and why.`;

  const messages = [{ role: "user", content: text || "Here's a photo of my plan." }];
  const executor = makeAgentExecutor(supabase, user.id);
  const result = await callGeminiWithTools(system, messages, AGENT_TOOLS, executor, {
    maxSteps: 20,
    maxTokens: 2048,
    images: image ? [image] : undefined,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error, detail: result.detail, actions: result.actions || [] }, { status: 502 });
  }
  return NextResponse.json({ reply: result.text, actions: result.actions });
}
