import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, recoveryCode, newPassword } = req.body;
  if (!email || !recoveryCode || !newPassword) {
    return res.status(400).json({ error: "Email, recovery code, and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const emailNorm = email.trim().toLowerCase();
  const codeNorm = recoveryCode.trim().toUpperCase();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?email=eq.${encodeURIComponent(emailNorm)}&select=*`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const users = await userRes.json();

    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Incorrect email or recovery code" });
    }

    const user = users[0];

    if (!user.recovery_code_hash) {
      return res.status(400).json({ error: "No recovery code found for this account" });
    }

    const isMatch = await bcrypt.compare(codeNorm, user.recovery_code_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect email or recovery code" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/app_users?id=eq.${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ password_hash: newPasswordHash }),
    });

    if (!updateRes.ok) {
      return res.status(500).json({ error: "Failed to reset password" });
    }

    return res.status(200).json({ success: true, message: "Password reset successful. Please login with your new password." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
