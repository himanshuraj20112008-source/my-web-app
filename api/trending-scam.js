import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const cached = await kv.get("trending_scam");
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (false) {
      return res.status(200).json(cached);
    }

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content:
              "Search for the most significant new scam or fraud trend reported in India in the last 7 days (UPI fraud, phishing, phone scams, etc). Reply ONLY with JSON, no markdown, no preamble: {\"title\":\"short scam name\",\"description\":\"2 sentence explanation of how it works\",\"action\":\"1 sentence on what to do\",\"source\":\"publication name\",\"sourceUrl\":\"direct article URL\"}",
          },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    const aiData = await aiRes.json();
    const textBlock = aiData.content?.find((b) => b.type === "text");
    console.log("RAW AI RESPONSE:", JSON.stringify(aiData));
    const clean = (textBlock?.text || "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const isNewScam =
      !cached || !cached.title || cached.title.toLowerCase().trim() !== parsed.title.toLowerCase().trim();

    const updated = {
      title: parsed.title,
      description: parsed.description,
      action: parsed.action,
      source: parsed.source,
      sourceUrl: parsed.sourceUrl,
      lastChecked: now,
      lastUpdated: isNewScam ? now : (cached?.lastUpdated || now),
    };

    await kv.set("trending_scam", updated);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("trending-scam error:", err);
    return res.status(200).json({ error: "unavailable" });
  }
}
