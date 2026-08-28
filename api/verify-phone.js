export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");

  // Helper: safe fetch (no timeout for now — just catches errors so one API
  // failing doesn't crash the whole request)
  async function safeFetch(url) {
    try {
      const r = await fetch(url);
      return await r.json();
    } catch (e) {
      return null; // treat any failure as "unavailable"
    }
  }

  // --- Source 1: NumVerify (primary) ---
  const numverifyKey = process.env.NUMVERIFY_API_KEY;
  const numverifyData = await safeFetch(
    `http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${cleaned}&country_code=IN&format=1`
  );

  // --- Source 2: IPQS (secondary/fallback, free tier) ---
  const ipqsKey = process.env.IPQS_API_KEY;
  const ipqsData = ipqsKey
    ? await safeFetch(
        `https://ipqualityscore.com/api/json/phone/${ipqsKey}/${cleaned}?country=[IN]`
      )
    : null;

  const nvValid = numverifyData?.valid === true;
  const nvInvalid = numverifyData && numverifyData.valid === false;
  const ipqsValid = ipqsData?.valid === true;
  const ipqsInvalid = ipqsData && ipqsData.valid === false;

  // --- Cross-check confidence ---
  let confidence = "low";
  if (numverifyData && ipqsData) {
    confidence = (nvValid === ipqsValid) ? "high" : "low";
  } else if (numverifyData || ipqsData) {
    confidence = "medium"; // only one source responded
  }

  // --- VoIP / risky line-type signal (not scored before — now included) ---
  const lineType = (numverifyData?.line_type || ipqsData?.line_type || "").toLowerCase();
  const isVoip = lineType.includes("voip") || ipqsData?.VOIP === true;
  const isPrepaid = ipqsData?.prepaid === true;
  const fraudScore = typeof ipqsData?.fraud_score === "number" ? ipqsData.fraud_score : null;

  // --- Build weighted signal list (same style as your other scanners) ---
  const indicators = [];

  if (nvInvalid || ipqsInvalid) {
    indicators.push({ reason: "Number reported invalid by verification API", weight: 70 });
  } else if (nvValid || ipqsValid) {
    indicators.push({ reason: "Number confirmed active by verification API", weight: -10 });
  }

  if (isVoip) {
    indicators.push({ reason: "VoIP / virtual line detected (common in fraud calls)", weight: 35 });
  }
  if (isPrepaid) {
    indicators.push({ reason: "Prepaid line (higher fraud association)", weight: 10 });
  }
  if (fraudScore !== null && fraudScore >= 75) {
    indicators.push({ reason: "IPQS fraud score high", weight: 40 });
  }
  if (confidence === "low") {
    indicators.push({ reason: "Sources disagree on validity — unverified", weight: 15 });
  }

  return res.status(200).json({
    valid: nvValid || ipqsValid || false,
    number: numverifyData?.number || cleaned,
    carrier: numverifyData?.carrier || ipqsData?.carrier || null,
    lineType: lineType || "unknown",
    location: numverifyData?.location || ipqsData?.city || null,
    countryCode: numverifyData?.country_code || ipqsData?.country || null,
    isVoip,
    isPrepaid,
    fraudScore,
    confidence,           // "high" | "medium" | "low"
    sourcesUsed: {
      numverify: !!numverifyData,
      ipqs: !!ipqsData,
    },
        indicators,            // feed these weights into your existing scoring aggregator
    _debug_ipqs_raw: ipqsData, // TEMPORARY — remove after confirming field names
  });
}
