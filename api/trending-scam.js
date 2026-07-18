import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    const cached = await redis.get("trending_scam");
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Agar last check 24 ghante se kam purana hai, to wahi purana data bhej do
    if (false) {
      return res.status(200).json(cached);
    }

    // ── Step A: Tavily se real news search — sirf trusted Indian sources se ──
    const trustedDomains = [
      "ndtv.com",
      "timesofindia.indiatimes.com",
      "indiatoday.in",
      "hindustantimes.com",
      "livemint.com",
      "cybercrime.gov.in",
    ];

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "latest UPI fraud phishing scam trend India news",
        topic: "news",
        search_depth: "basic",
        max_results: 8,
        days: 7,
        include_domains: trustedDomains,
      }),
    });
const tavilyData = await tavilyRes.json();
    let allResults = tavilyData.results || [];

    // Agar trusted domains mein kuch nahi mila, to bina filter ke dobara try karo
   if (allResults.length === 0) {
      const fallbackRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: "latest UPI fraud phishing scam trend India news",
          topic: "news",
          search_depth: "basic",
          max_results: 8,
          days: 7,
        }),
      });
      const fallbackData = await fallbackRes.json();
      allResults = fallbackData.results || [];
    }

    if (allResults.length === 0) {
      throw new Error("No search results from Tavily");
    }

    // Groq ko saare articles do, usse SIRF scam/fraud wala chunne do
    const articleList = allResults
      .slice(0, 6)
      .map((r, i) => `[${i}] Title: ${r.title}\nSnippet: ${(r.content || "").slice(0, 200)}`)
      .join("\n\n");

    // ── Step B: Groq us real article ko simple JSON mein summarize karega ──
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Here are ${allResults.slice(0,6).length} news articles. Pick ONLY the one that is genuinely about a scam, fraud, phishing, or cyber threat in India. If NONE of them are about a scam/fraud/cyber threat, reply with {"noMatch":true}.\n\nIf you find a matching article, reply ONLY with JSON, no markdown, no preamble:\n{"index":<article number>,"title":"short scam name (max 6 words)","description":"2 sentence explanation of how this scam works","action":"1 sentence on what to do"}\n\n${articleList}`,
          },
        ],
      }),
    });
    const groqData = await groqRes.json();
    const groqText = groqData.choices?.[0]?.message?.content || "{}";
    const clean = groqText.replace(/```json|```/g, "").trim();
    const summary = JSON.parse(clean);

    if (summary.noMatch || summary.index === undefined) {
      throw new Error("No genuine scam article found in results");
    }

    const chosen = allResults[summary.index] || allResults[0];

    const parsed = {
      title: summary.title,
      description: summary.description,
      action: summary.action,
      source: new URL(chosen.url).hostname.replace("www.", ""),
      sourceUrl: chosen.url,
    };

    // Purane title se compare karke check karo genuinely naya scam hai ya same
    const isNewScam =
      !cached || !cached.title || cached.title.toLowerCase().trim() !== parsed.title.toLowerCase().trim();

    const updated = {
      title: parsed.title,
      description: parsed.description,
      action: parsed.action,
      source: parsed.source,
      sourceUrl: parsed.sourceUrl,
      lastChecked: now,
      lastUpdated: isNewScam ? now : cached.lastUpdated || now,
    };

    await redis.set("trending_scam", updated);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("trending-scam error:", err);
    return res.status(200).json({ error: "unavailable" });
  }
}
