export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });

  try {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const hibpRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    const text = await hibpRes.text();

    let count = 0;
    for (const line of text.split("\n")) {
      const [suf, cnt] = line.trim().split(":");
      if (suf === suffix) {
        count = parseInt(cnt, 10);
        break;
      }
    }

    return res.status(200).json({ pwned: count > 0, count });
  } catch (e) {
    return res.status(500).json({ error: "Check failed" });
  }
}
