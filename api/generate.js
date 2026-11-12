// Vercel serverless function: /api/generate
// Calls the Google Gemini API (free tier) and keeps the key on the server.
// Set GEMINI_API_KEY in Vercel project settings. Use a key from Google AI Studio
// that does NOT have billing enabled, so the free tier can never charge you.

const MODELS = [process.env.GEMINI_MODEL || "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const MAX_OUTPUT_TOKENS = 2500;

function toText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((b) => (b && typeof b.text === "string" ? b.text : "")).join("\n");
  }
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
  }

  const { messages, tools } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 10) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const body = {
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: toText(m.content).slice(0, 12000) }],
    })),
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  // Only Google Search grounding can be turned on, nothing else passes through.
  if (Array.isArray(tools) && tools.some((t) => t && t.name === "web_search")) {
    body.tools = [{ google_search: {} }];
  }

  try {
    // Gemini can answer 503 (high demand). Try the next model in the list instead of waiting.
    let upstream, data;
    for (const model of MODELS) {
      try {
        upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(18000),
          }
        );
        data = await upstream.json();
      } catch (e) {
        console.error("Gemini attempt failed", model, String(e));
        upstream = { ok: false, status: 503 };
        data = {};
        continue;
      }
      if (upstream.ok) break;
      console.error("Gemini attempt", model, upstream.status, JSON.stringify(data).slice(0, 300));
      if (![500, 503, 404].includes(upstream.status)) break;
    }
    if (!upstream.ok) {
      console.error("Gemini error", upstream.status, JSON.stringify(data).slice(0, 500));
      const status = upstream.status === 429 ? 429 : upstream.status === 503 ? 503 : 502;
      return res.status(status).json({ error: "Upstream error", detail: data && data.error && data.error.message });
    }
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.map((p) => p.text || "").join("");
    // Same shape the page already reads: { content: [{ type: "text", text }] }
    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Gemini request failed", String(err));
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
