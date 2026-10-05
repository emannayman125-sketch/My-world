// Server-only helper. Never import this from a "use client" file --
// it reads the API key directly from process.env and must only ever
// run on the server (API routes / server components).

// Override from Vercel env (GEMINI_MODEL) without touching code if Google renames/retires a model.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// 503 (model overloaded) and 429 (rate limited) are usually transient on
// Google's side -- worth a couple of quick retries before giving up and
// showing Ahmed an error. Anything else (bad key, bad model name, safety
// block) is not retried since trying again won't change the outcome.
const RETRYABLE_STATUS = new Set([503, 429]);

async function fetchWithRetry(url, options, { attempts = 3, baseDelayMs = 500 } = {}) {
  let lastRes;
  for (let i = 0; i < attempts; i++) {
    lastRes = await fetch(url, options);
    if (lastRes.ok || !RETRYABLE_STATUS.has(lastRes.status)) return lastRes;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  return lastRes;
}

/**
 * Call Gemini with a system prompt + conversation history.
 * @param {string} systemPrompt
 * @param {{role: "user"|"assistant", content: string}[]} messages
 * @param {{ jsonMode?: boolean, maxTokens?: number }} [opts]
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
      // Newer Gemini models spend part of this budget on "thinking", so keep it generous.
      maxOutputTokens: opts.maxTokens || 4096,
      // Capping "thinking" keeps replies snappy for a chat assistant — these are
      // short conversational or structured-JSON tasks, not problems that need
      // deep deliberation. Override per-call via opts.thinkingBudget if one ever does.
      thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? (opts.jsonMode ? 1024 : 768) },
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  try {
    const res = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        // Key goes in a header, not the URL, so it never ends up in logs.
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
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

/**
 * Gemini with function calling (tool use): the model can call real functions
 * in the app instead of only producing text. Used for the agent chat, where
 * a request like "finish task X and log habit Y" should actually do both.
 *
 * @param {string} systemPrompt
 * @param {{role: "user"|"assistant", content: string}[]} messages
 * @param {object[]} tools  Gemini functionDeclarations (name, description, parameters)
 * @param {(name: string, args: object) => Promise<object>} executor  runs one tool call, returns a JSON-safe result
 * @param {{ maxSteps?: number, maxTokens?: number }} [opts]
 * @returns {Promise<{ text: string, actions: {name:string, args:object, result:object}[] } | { error: string, actions: object[] }>}
 */
export async function callGeminiWithTools(systemPrompt, messages, tools, executor, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "no_api_key", actions: [] };

  let contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const actions = [];
  const maxSteps = opts.maxSteps || 6;

  for (let step = 0; step < maxSteps; step++) {
    const body = {
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      tools: [{ functionDeclarations: tools }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: opts.maxTokens || 2048,
        // Tool-call decisions need a bit more room to reason than plain chat,
        // but still bounded — this was the main source of Hamzawi feeling slow.
        thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? 1024 },
      },
    };

    let res;
    try {
      res = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
        }
      );
    } catch (err) {
      return { error: "fetch_failed", detail: String(err), actions };
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { error: `upstream_error:${res.status}`, detail: errBody.slice(0, 500), actions };
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const functionCalls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
    const text = parts.filter((p) => p.text).map((p) => p.text).join("");

    if (functionCalls.length === 0) {
      if (!text) {
        const finishReason = data?.candidates?.[0]?.finishReason;
        return { error: "empty_response", detail: finishReason || "unknown", actions };
      }
      return { text, actions };
    }

    // Keep the model's own turn (its function-call parts) in the transcript.
    contents.push({ role: "model", parts });

    // Run every requested call, then answer them all in ONE user turn — Gemini
    // requires exactly one functionResponse per functionCall, each echoing
    // that call's id, in the same turn.
    const functionResponseParts = [];
    for (const fc of functionCalls) {
      let result;
      try {
        result = await executor(fc.name, fc.args || {});
      } catch (err) {
        result = { ok: false, error: String(err) };
      }
      actions.push({ name: fc.name, args: fc.args, result });
      functionResponseParts.push({
        functionResponse: { name: fc.name, id: fc.id, response: result },
      });
    }
    contents.push({ role: "user", parts: functionResponseParts });
  }

  return { error: "max_steps_exceeded", actions };
}
