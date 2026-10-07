// Server-only helper. Never import this from a "use client" file --
// it reads the API key directly from process.env and must only ever
// run on the server (API routes / server components).

// A single hardcoded model name is a single point of failure -- Google
// has already retired one model on us mid-project. GEMINI_MODEL in
// Vercel still overrides everything (checked first, alone), but
// otherwise we try a short list in order and fall through to the next
// one on a 404 (model doesn't exist/was retired) or on a 503/429 that
// doesn't clear up after retrying. Whichever one answers first is used
// for the rest of that call.
const MODEL_CANDIDATES = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.8-flash"];

// A real Gemini call can legitimately take several seconds (more with
// a thinking budget) -- a short fixed timeout per attempt was cutting
// genuinely-in-progress requests off and reporting them as failures.
// Vercel's Hobby plan still kills the whole function at 10s no matter
// what, so instead of a fixed per-candidate timeout, every attempt
// shares one overall deadline: the first (most likely correct)
// candidate gets almost all of it, and only a FAST failure (404, or a
// quick 503/429 response) moves on to try the next candidate with
// whatever time is left. A timeout itself is not treated as a reason
// to try another candidate -- if the budget's gone, it's gone.
const RETRYABLE_STATUS = new Set([503, 429]);
const TOTAL_BUDGET_MS = 9000;
const MIN_ATTEMPT_MS = 1500; // not worth even trying a candidate with less than this left

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    // timeout/abort/network failure -- synthesize a response-shaped object
    // so every caller can treat this the same as a normal HTTP failure
    return { ok: false, status: 0, text: async () => `timeout_or_network_error: ${String(err)}` };
  } finally {
    clearTimeout(timer);
  }
}

// Tries each candidate model in order against the given endpoint
// builder/options, returning the first successful response. If every
// candidate fails (or the shared time budget runs out), returns the
// last response/detail so the caller can still report something useful.
async function fetchFromFirstWorkingModel(buildUrl, options, preferredModel) {
  let lastRes, lastModel;
  const order = preferredModel
    ? [preferredModel, ...MODEL_CANDIDATES.filter((m) => m !== preferredModel)]
    : MODEL_CANDIDATES;
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const model of order) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break; // out of budget -- stop trying, report the last real failure
    const res = await fetchWithTimeout(buildUrl(model), options, remaining);
    lastRes = res;
    lastModel = model;
    if (res.ok) return { res, model };
    if (res.status === 0) break; // a timeout ate the whole remaining budget -- no point trying more
    if (res.status !== 404 && !RETRYABLE_STATUS.has(res.status)) break; // e.g. bad key/request -- won't help to try another model
  }
  return { res: lastRes, model: lastModel };
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
    const { res } = await fetchFromFirstWorkingModel(
      (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        // Key goes in a header, not the URL, so it never ends up in logs.
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { error: `upstream_error:${res.status}`, detail: errBody.slice(0, 500) || `no response body (tried: ${MODEL_CANDIDATES.join(", ")})` };
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
  let workingModel = null; // once one candidate answers, reuse it for the rest of this loop

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
      const result = await fetchFromFirstWorkingModel(
        (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
        },
        workingModel
      );
      res = result.res;
      workingModel = result.model;
    } catch (err) {
      return { error: "fetch_failed", detail: String(err), actions };
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { error: `upstream_error:${res.status}`, detail: errBody.slice(0, 500) || `no response body (tried: ${MODEL_CANDIDATES.join(", ")})`, actions };
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
