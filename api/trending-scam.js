import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
});

const TRUSTED_DOMAINS = [
  "rbi.org.in",
  "npci.org.in",
  "cybercrime.gov.in",
  "pib.gov.in",
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
];

// Query list ghata di gayi hai (8 se 4) — credits kam waste hon isliye
const SEARCH_QUERIES = [
  "UPI payment fraud scam alert India",
  "phishing OTP fraud scam India news",
  "digital arrest KYC scam fraud India",
  "job work from home scam fraud India",
];

// ── Tavily search ──
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

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Tavily HTTP ${r.status}: ${errText.slice(0, 200)}`);
  }

  const data = await r.json();
  if (data.error) throw new Error(`Tavily error: ${data.error}`);

  return data.results || [];
}

// ── Serper.dev search (fallback) ──
async function searchSerper(query, useDomainFilter) {
  // Serper mein direct include_domains nahi hota, isliye site: operators use karte hain
  const domainFilter = useDomainFilter
    ? " (" + TRUSTED_DOMAINS.map((d) => `site:${d}`).join(" OR ") + ")"
    : "";

  const r = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query + domainFilter, num: 8 }),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Serper HTTP ${r.status}: ${errText.slice(0, 200)}`);
  }

  const data = await r.json();
  const organic = data.organic || [];

  // Tavily jaisa hi shape banate hain: url, title, content
  return organic.map((item) => ({
    url: item.link,
    title: item.title,
    content: item.snippet || "",
  }));
}

// ── Fallback wrapper: pehle Tavily try karo, fail ho to Serper try karo ──
async function searchWithFallback(query, useDomainFilter) {
  try {
    const results = await searchTavily(query, useDomainFilter);
    return { results, provider: "tavily" };
  } catch (tavilyErr) {
    console.error(`Tavily failed for "${query}":`, tavilyErr.message);
    try {
      const results = await searchSerper(query, useDomainFilter);
      console.warn(`Fell back to Serper for "${query}"`);
      return { results, provider: "serper" };
    } catch (serperErr) {
      console.error(`Serper also failed for "${query}":`, serperErr.message);
      return { results: [], provider: "none" };
    }
  }
}

export default async function handler(req, res) {
  try {
    const cached = await redis.get("trending_scam");
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const cooldownMs = 2 * 60 * 60 * 1000; // 2 ghante ka cooldown failure ke baad

    const recentTitles = (await redis.get("recent_scam_titles")) || [];

    if (cached && cached.lastChecked && now - cached.lastChecked < oneDayMs) {
      return res.status(200).json(cached);
    }

    // Agar pichli baar recently fail hua tha, to abhi retry mat karo (credits bachao)
    const lastFailure = await redis.get("trending_scam_last_failure");
    if (lastFailure && now - lastFailure < cooldownMs) {
      return res.status(200).json(cached || { error: "unavailable" });
    }

    let allResults = [];
    let anyFallbackUsed = false;

    for (const q of SEARCH_QUERIES) {
      const { results, provider } = await searchWithFallback(q, true);
      if (provider === "serper") anyFallbackUsed = true;
      allResults.push(...results);
    }

    if (allResults.length === 0) {
      for (const q of SEARCH_QUERIES) {
        const { results, provider } = await searchWithFallback(q, false);
        if (provider === "serper") anyFallbackUsed = true;
        allResults.push(...results);
      }
    }

    if (allResults.length === 0) {
      await redis.set("trending_scam_last_failure", now);
      throw new Error("No search results from Tavily or Serper");
    }

    if (anyFallbackUsed) {
      console.warn("This run used Serper fallback (Tavily unavailable)");
    }

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

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: `Here are ${Math.min(allResults.length, 15)} news articles from different sources. Your job:

1. Find articles that describe a SPECIFIC scam/fraud METHOD used against ordinary individuals — for example: UPI payment fraud, phishing emails/SMS, fake KYC update calls, digital arrest scams, OTP theft, fake investment/loan apps, deepfake voice scams, fake job offers, online shopping fraud, or similar cyber/digital scams targeting common people.

2. DO NOT count articles about: general crime news, insurance fraud detection systems, government policy/schemes, corporate fraud, court cases, arrests without scam method details, or anything not directly a scam technique used against individuals.

3. Group articles that describe the SAME or a VERY SIMILAR scam pattern together. Pick the group with the MOST articles (most cross-source verification = most trending). If there's a tie, prefer the most recent/severe one, AND prefer a more specific or newly-emerging pattern over a broad, generic, long-covered category like general UPI fraud — unless the UPI-related articles describe a genuinely new tactic, fraud ring, or fresh official advisory.

4. IMPORTANT — Avoid repeating recent topics: These scam titles were already shown in the last few checks: ${recentTitles.length ? recentTitles.join(", ") : "none"}. If a genuinely DIFFERENT qualifying scam pattern exists in the articles below (even with fewer articles, as long as it has at least 2 supporting articles), PREFER that over repeating one of the recent titles above. Only repeat a recent title if NO other qualifying pattern exists at all.

5. If NO articles qualify at all, reply ONLY with: {"noMatch":true}

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
      await redis.set("trending_scam_last_failure", now);
      throw new Error("No genuine scam article found in results");
    }

    const matchedArticles = summary.matchedIndices.map((i) => allResults[i]).filter(Boolean);

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
      sources: sources.slice(0, 5),
    };

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

    const updatedRecentTitles = [parsed.title, ...recentTitles.filter((t) => t.toLowerCase() !== parsed.title.toLowerCase())].slice(0, 3);
    await redis.set("recent_scam_titles", updatedRecentTitles);

    await redis.del("trending_scam_last_failure"); // success hua to cooldown clear kar do
    await redis.set("trending_scam", updated);
    return res.status(200).json(updated);
  } catch (err) {
    console.error("trending-scam error:", err);
    return res.status(200).json({ error: "unavailable" });
  }
}
