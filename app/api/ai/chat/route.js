import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";
import { getContextKnowledge } from "@/lib/ai/knowledge";

const CONTEXT_LABEL = {
  all: "general",
  english: "English practice",
  mba: "MBA & Learning",
  research: "Research",
  library: "Library",
  supplyChain: "Supply Chain (Ahmed's job)",
  business: "Business (Ahmed's contracting business)",
  trading: "Trading (NASDAQ, journaling only -- never financial advice)",
  creator: "Creator Studio / content ideas",
  personal: "personal, general conversation",
};

export async function POST(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { messages, context = "all", useKnowledge = false, locale = "ar", voice = false } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "missing_messages" }, { status: 400 });
  }

  let knowledgeBlock = "";
  if (useKnowledge && context !== "personal") {
    const summary = await getContextKnowledge(supabase, user.id, context);
    if (summary) {
      knowledgeBlock = `\n\nAuthorized context from Ahmed's own data (only what he explicitly enabled -- use it if relevant, never invent beyond it):\n${summary}`;
    }
  }

  const languageInstruction =
    locale === "ar"
      ? "Reply in Egyptian Arabic (اللهجة المصرية), warm and natural, unless Ahmed writes in English or is specifically practicing English."
      : "Reply in English unless Ahmed writes in Arabic.";

  // Spoken replies are read aloud by the browser, so they must sound like speech, not like a document.
  const voiceInstruction = voice
    ? "\n\nThis is a LIVE VOICE conversation: your reply will be read aloud. Answer in 1 to 3 short, natural spoken sentences. No markdown, no bullet points, no numbered lists, no emojis, no headings, no URLs. If the topic needs more depth, give the key point and offer to continue. Ask at most one question."
    : "";

  const systemPrompt = `You are "Hamzawi" (حمزاوي), Ahmed's personal AI assistant inside his private personal-world app.

Your personality: warm, direct, intelligent, encouraging but never fake-cheerful. You help him think, study, plan, and organize -- you are not a generic chatbot.

Current focus area: ${CONTEXT_LABEL[context] || "general"}.
${languageInstruction}

Hard rules:
- Never fabricate facts, quotes, citations, or data you don't have.
- If you don't know something or lack the data, say so plainly.
- Trading Desk is a journal, not financial advice -- never give buy/sell recommendations or price predictions.
- Keep replies focused and not overly long unless Ahmed asks for depth.
- You cannot directly save, delete, or modify anything in the app yourself -- if Ahmed wants something saved (a task, idea, note), tell him to use Brain Dump or add it directly, don't pretend you saved it.${knowledgeBlock}${voiceInstruction}`;

  const result = await callGemini(systemPrompt, messages, voice ? { maxTokens: 2048 } : {});

  if (result.error) {
    console.error("Hamzawi/Gemini error:", result.error, result.detail);
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: 502 });
  }

  return NextResponse.json({ reply: result.text });
}
