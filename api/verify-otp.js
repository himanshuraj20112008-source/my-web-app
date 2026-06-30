export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  const emailNorm = email.trim().toLowerCase();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Get latest OTP for this email
    const otpRes = await fetch(
      `${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(emailNorm)}&select=*&order=created_at.desc&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const records = await otpRes.json();

    if (!records || records.length === 0) {
      return res.status(400).json({ error: "No OTP found. Please request a new one." });
    }

    const record = records[0];

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (record.attempts >= 5) {
      return res.status(429).json({ error: "Too many incorrect attempts. Please request a new OTP." });
    }

    if (record.otp !== otp.trim()) {
      // Increment attempts
      await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${record.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ attempts: record.attempts + 1 }),
      });
      return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    }

    // OTP correct — fetch user data
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?email=eq.${encodeURIComponent(emailNorm)}&select=*`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const users = await userRes.json();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete used OTP
    await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${record.id}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });

    return res.status(200).json({ success: true, user: users[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
