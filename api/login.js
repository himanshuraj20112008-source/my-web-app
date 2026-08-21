import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailNorm = email.trim().toLowerCase();
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/app_users?email=eq.${encodeURIComponent(emailNorm)}&select=*`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const users = await userRes.json();

    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const user = users[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: "This account has no password set. Please sign up again." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    delete user.password_hash;
    delete user.recovery_code_hash;

    return res.status(200).json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
