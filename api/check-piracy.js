export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ available: false, reason: "API key not configured" });
  }

  try {
    const encodedUrl = encodeURIComponent(url);
    const ipqsRes = await fetch(
      `https://www.ipqualityscore.com/api/json/url/${apiKey}/${encodedUrl}`
    );
    const data = await ipqsRes.json();

    if (!data.success) {
      return res.status(200).json({ available: false, reason: data.message || "Lookup failed" });
    }

    return res.status(200).json({
      available: true,
      riskScore: data.risk_score ?? null,
      suspicious: data.suspicious ?? false,
      malware: data.malware ?? false,
      phishing: data.phishing ?? false,
      category: data.category ?? null,
      domainAge: data.domain_age?.human ?? null,
    });
  } catch (err) {
    return res.status(200).json({ available: false, reason: "Request failed" });
  }
}
