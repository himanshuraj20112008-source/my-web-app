export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, value, category, description } = req.body;
  if (!type || !value) return res.status(400).json({ error: "type and value required" });

  const SUPABASE_URL = "https://mecmxuzzjbkhlmwuvqik.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: "Missing SUPABASE_ANON_KEY env var" });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/scam_reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ type, value, category, description })
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({ error: text, status: response.status });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
