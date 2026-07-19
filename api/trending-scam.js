import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
});

const TRUSTED_DOMAINS = [
  // Official / Government
  "rbi.org.in",
  "npci.org.in",
  "cybercrime.gov.in",
  "pib.gov.in",
  // Major News Channels
  "ndtv.com",
  "timesofindia.indiatimes.com",
  "indiatoday.in",
  "hindustantimes.com",
  "livemint.com",
  "thehindu.com",
  "indianexpress.com",
  "business-standard.com",
  "cnbctv18.com",
  "news18.com",
  "zeenews.india.com",
  "economictimes.indiatimes.com",
  "moneycontrol.com",
  "financialexpress.com",
  "cnbctv18.com",
];

const SEARCH_QUERIES = [
  "UPI payment fraud scam alert India",
  "phishing OTP fraud scam India news",
  "digital arrest KYC scam fraud India",
];

async function searchTavily(query, useDomainFilter) {
  const body = {
    api_key: process.env.TAVILY_API_KEY,
    query,
    topic: "general",
    search_depth: "advanced",
    max_results: 6,
    days: 20,
  };
  if (useDomainFilter) body.include_domains = TRUSTED_DOMAINS;

  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return data.results || [];
}

export default async function handler(req, res) {
  try {
    const cached = await redis.get("trending_scam");
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Agar last check 24 ghante se kam purana hai, to wahi purana data bhej do
    if (cached && cached.lastChecked && now - cached.lastChecked < oneDayMs) {
      return res.status(200).json(cached);
    }

    // ── Step A: Multiple queries, trusted sources se, results combine karo ──
    let allResults = [];
    for (const q of SEARCH_QUERIES) {
      const results = await searchTavily(q, true);
      allResults.push(...results);
    }

    // Agar trusted domains se kuch bhi nahi mila, to bina filter ke try karo
    if (allResults.length === 0) {
      for (const q of SEARCH_QUERIES) {
        const results = await searchTavily(q, false);
        allResults.push(...results);
      }
    }

    if (allResults.length === 0) {
      throw new Error("No search results from Tavily");
    }

    // Duplicate URLs hatao
    const seen = new Set();
    allResults = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    const articleList = allResults
      .slice(0, 15)
      .map((r, i) => `[${i}] Source: ${new URL(r.url).hostname.replace("www.", "")}\nTitle: ${r.title}\nSnippet: ${(r.content || "").slice(0, 200)}`)
      .join("\n\n");

    // ── Step B: Groq — cross-verify karke sabse trending scam dhoondo ──
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: `Here are ${Math.min(allResults.length, 15)} news articles from different sources. Your job:

1. Find articles that describe a SPECIFIC scam/fraud METHOD used against ordinary individuals — for example: UPI payment fraud, phishing emails/SMS, fake KYC update calls, digital arrest scams, OTP theft, fake investment/loan apps, deepfake voice scams, fake job offers, online shopping fraud, or similar cyber/digital scams targeting common people.

2. DO NOT count articles about: general crime news, insurance fraud detection systems, government policy/schemes, corporate fraud, court cases, arrests without scam method details, or anything not directly a scam technique used against individuals.

3. Group articles that describe the SAME or a VERY SIMILAR scam pattern together. Pick the group with the MOST articles (most cross-source verification = most trending). If there's a tie, pick the most recent/severe one.

4. If NO articles qualify at all, reply ONLY with: {"noMatch":true}

If you find a qualifying group, reply ONLY with JSON, no markdown, no preamble:
{"title":"short scam name (max 6 words)","description":"2-3 sentence explanation of how this scam works, written simply for a general Indian audience","action":"1 sentence on what to do to protect yourself","matchedIndices":[list of article numbers that describe this same scam]}

${articleList}`,
          },
        ],
      }),
    });
   const groqData = await groqRes.json();
    const groqText = groqData.choices?.[0]?.message?.content || "{}";

    const clean = groqText.replace(/```json|```/g, "").trim();
    const summary = JSON.parse(clean);

    if (summary.noMatch || !summary.matchedIndices || summary.matchedIndices.length === 0) {
      throw new Error("No genuine scam article found in results");
    }

    // Matched articles se unique sources nikalo
    const matchedArticles = summary.matchedIndices
      .map((i) => allResults[i])
      .filter(Boolean);

    const seenDomains = new Set();
    const sources = [];
    for (const art of matchedArticles) {
      const domain = new URL(art.url).hostname.replace("www.", "");
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);
        sources.push({ name: domain, url: art.url });
      }
    }

    const parsed = {
      title: summary.title,
      description: summary.description,
      action: summary.action,
      sources: sources.slice(0, 5), // max 5 source links dikhao
    };

    // Purane title se compare karke check karo genuinely naya scam hai ya same
    const isNewScam =
      !cached || !cached.title || cached.title.toLowerCase().trim() !== parsed.title.toLowerCase().trim();

    const updated = {
      title: parsed.title,
      description: parsed.description,
      action: parsed.action,
      sources: parsed.sources,
      sourceCount: parsed.sources.length,
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
