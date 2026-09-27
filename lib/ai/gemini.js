// Server-only helper. Never import this from a "use client" file --
// it reads the API key directly from process.env and must only ever
// run on the server (API routes / server components).

const MODEL = "gemini-2.5-flash";

/**
 * Call Gemini with a system prompt + conversation history.
 * @param {string} systemPrompt
 * @param {{role: "user"|"assistant", content: string}[]} messages
 * @param {{ jsonMode?: boolean }} [opts]
 * @returns {Promise<{ text: string } | { error: string }>}
 */
export async function callGemini(systemPrompt, messages, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "no_api_key" };
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: opts.jsonMode ? 0.2 : 0.7,
      maxOutputTokens: 1024,
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { error: `upstream_error:${res.status}`, detail: errBody.slice(0, 500) };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

    if (!text) {
      // Blocked by safety filters or empty response
      const finishReason = data?.candidates?.[0]?.finishReason;
      return { error: "empty_response", detail: finishReason || "unknown" };
    }

    return { text };
  } catch (err) {
    return { error: "fetch_failed", detail: String(err) };
  }
}
