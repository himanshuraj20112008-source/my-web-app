export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const emailNorm = email.trim().toLowerCase();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_API_KEY) {
    return res.status(500).json({ error: "Server misconfigured — missing env vars" });
  }

  try {
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?email=eq.${encodeURIComponent(emailNorm)}&select=id,name`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const users = await userRes.json();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "No account found with this email. Please sign up first." });
    }

    // Rate limit: check only OTPs that were successfully created in last 5 minutes
    const cooldownAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const recentRes = await fetch(
     `${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(emailNorm)}&created_at=gte.${cooldownAgo}&select=id&order=created_at.desc&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const recent = await recentRes.json();
    if (recent && recent.length > 0) {
      return res.status(429).json({ error: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send email FIRST — only save OTP to DB if email actually goes through
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SentinelX <onboarding@resend.dev>",
        to: [emailNorm],
        subject: `${otp} is your SentinelX login code`,
        html: `<div style="font-family:sans-serif;padding:20px">
          <h2 style="color:#00D4FF">SentinelX Login</h2>
          <p>Hi ${users[0].name || ""},</p>
          <p>Your one-time login code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:20px 0">${otp}</div>
          <p>This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
      }),
    });

    const emailText = await emailRes.text();
    if (!emailRes.ok) {
      return res.status(500).json({ error: "Failed to send email: " + emailText });
    }

    // Email sent successfully — NOW save the OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await fetch(`${SUPABASE_URL}/rest/v1/otp_codes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email: emailNorm, otp, expires_at: expiresAt }),
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
