import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGeminiWithTools } from "@/lib/ai/gemini";
import { AGENT_TOOLS, makeAgentExecutor } from "@/lib/ai/agentTools";

// Raises the serverless function's time ceiling as far as the hosting plan allows (Hobby still hard-caps at 10s; this is a no-op there, but matters if/when the plan changes).
export const maxDuration = 30;


// Hamzawi as an agent: he doesn't just talk about the app, he acts in it.
// One message can trigger several real actions (add a task, log a habit,
// log a trade...) in a single turn. Everything the model can do is listed
// explicitly in AGENT_TOOLS — nothing outside that list, no email, no
// deleting anything, and the Journal is never touched by the agent.
export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const locale = body.locale === "en" ? "en" : "ar";
  const voice = !!body.voice;
  if (messages.length === 0) return NextResponse.json({ error: "missing_messages" }, { status: 400 });

  const voiceInstruction = voice
    ? "\n\nThis reply will be read aloud. After acting, answer in 1-3 short natural spoken sentences: no markdown, no lists, no emojis."
    : "";

  const system = `You are Hamzawi, Ahmed's personal agent living inside his own private app ("Your World"). Unlike a normal chat assistant, you can actually DO things here by calling the tools available to you — adding tasks, logging a habit, logging a trade, and so on. A single message from him can need several tool calls; call all of them before replying.

Language: reply in ${locale === "ar" ? "natural, warm Egyptian Arabic" : "plain, warm English"}.

Hard rules:
- Only use the tools you're given. You have NO access to email, messaging apps, or anything outside this app.
- Never invent that you did something you did not actually call a tool for. Your final reply must accurately reflect the tool results, including any failures.
- If "complete_task" or "log_habit_done" returns an "ambiguous" error with candidates, ask him which one he means instead of guessing.
- If a tool returns ok:false for another reason, say plainly what didn't work (e.g. today's top 3 is already full) — don't pretend it succeeded.
- Never call a tool for something he didn't actually ask for.
- You cannot delete or undo anything — if he asks to delete/remove something, tell him to do it from that section of the app himself.
- After acting, give a short, warm, specific confirmation of exactly what happened (using the real titles/numbers from the tool results) — not a generic "done!".
- For list_reminders / summarize_today, turn the returned data into a natural, human summary — don't just repeat it as a list of fields. The Journal is intentionally never included in "today" summaries; don't mention it or claim to know what's in it.${voiceInstruction}`;

  const executor = makeAgentExecutor(supabase, user.id);
  const result = await callGeminiWithTools(system, messages, AGENT_TOOLS, executor, {
    maxSteps: 6,
    maxTokens: voice ? 1024 : 2048,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error, actions: result.actions || [] }, { status: 502 });
  }
  return NextResponse.json({ reply: result.text, actions: result.actions });
}
