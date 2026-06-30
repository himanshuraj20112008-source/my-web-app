export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, designation, designationOther, email, mobile } = req.body;

  if (!name || !designation || !email || !mobile) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const emailNorm = email.trim().toLowerCase();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Check if email already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?email=eq.${encodeURIComponent(emailNorm)}&select=id`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const existing = await checkRes.json();
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "This email is already registered. Please login instead." });
    }

    // Create new user
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/app_users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: name.trim(),
        designation,
        designation_other: designation === "other" ? (designationOther || "").trim() : null,
        email: emailNorm,
        mobile: mobile.trim(),
      }),
    });

    const text = await createRes.text();
    if (!createRes.ok) {
      return res.status(500).json({ error: text });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
