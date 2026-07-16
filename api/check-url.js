// api/check-url.js
// Server-side proxy for Google Safe Browsing.
// The API key lives ONLY here (in Vercel env vars) — never sent to the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url" });
  }

  // IMPORTANT: set this in Vercel → Project → Settings → Environment Variables
  // Name it WITHOUT the VITE_ prefix so it's never bundled into frontend JS.
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) {
    return res.status(200).json({ status: "no_key" });
  }

  const targetUrl = url.startsWith("http") ? url : "https://" + url;

  try {
    const gsbRes = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "sentinelx", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: targetUrl }],
          },
        }),
      }
    );

    const data = await gsbRes.json();

    if (data.matches?.length > 0) {
      const threats = [...new Set(data.matches.map((m) => m.threatType))];
      return res.status(200).json({ status: "danger", threats });
    }

    return res.status(200).json({ status: "safe" });
  } catch (err) {
    console.error("Safe Browsing check failed:", err);
    return res.status(200).json({ status: "error" });
  }
}
