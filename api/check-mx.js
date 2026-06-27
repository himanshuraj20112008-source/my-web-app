import dns from "dns/promises";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { domain } = req.body || {};

  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ hasMX: false, mxCount: 0, topMX: null, error: "NO_DOMAIN" });
  }

  const cleanDomain = domain.trim().toLowerCase();

  try {
    const records = await dns.resolveMx(cleanDomain);

    if (!records || records.length === 0) {
      return res.status(200).json({ hasMX: false, mxCount: 0, topMX: null, error: null });
    }

    const sorted = records.sort((a, b) => a.priority - b.priority);

    return res.status(200).json({
      hasMX: true,
      mxCount: records.length,
      topMX: sorted[0].exchange,
      error: null,
    });
  } catch (err) {
    return res.status(200).json({
      hasMX: false,
      mxCount: 0,
      topMX: null,
      error: err.code || "LOOKUP_FAILED",
    });
  }
}
