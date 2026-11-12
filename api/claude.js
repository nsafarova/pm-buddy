// Vercel serverless function: /api/claude
// Keeps the Anthropic API key on the server. Set ANTHROPIC_API_KEY in Vercel project settings.

const ALLOWED_MODELS = new Set(["claude-sonnet-5"]);
const MAX_TOKENS_CAP = 1500;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
  }

  const { model, max_tokens, messages, tools } = req.body || {};
  if (!ALLOWED_MODELS.has(model) || !Array.isArray(messages) || messages.length === 0 || messages.length > 10) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const body = {
    model,
    max_tokens: Math.min(Number(max_tokens) || 1000, MAX_TOKENS_CAP),
    messages,
  };

  // Only the web search tool is allowed, nothing else can be passed through.
  if (Array.isArray(tools) && tools.length > 0) {
    body.tools = tools
      .filter((t) => t && t.type === "web_search_20250305" && t.name === "web_search")
      .map(() => ({ type: "web_search_20250305", name: "web_search", max_uses: 3 }));
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: "Upstream request failed" });
  }
}
