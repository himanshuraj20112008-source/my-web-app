export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { topic } = req.query;
  if (!topic) return res.status(400).json({ error: "topic required" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const today = new Date().toISOString().split("T")[0];

  try {
    // Check if today's quiz already exists for this topic
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_quiz?quiz_date=eq.${today}&topic=eq.${topic}&select=questions`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      return res.status(200).json({ questions: existing[0].questions, cached: true });
    }

    // Generate new questions via Anthropic API
const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity quiz generator. Reply ONLY with valid JSON, no markdown, no extra text.",
          },
          {
            role: "user",
            content: `Generate 10 fresh, unique cybersecurity quiz questions about "${topic}" for Indian users. Reply ONLY with a JSON array in this exact format:
[{"q":"question text","opts":["opt1","opt2","opt3","opt4"],"ans":0,"explain":"why this is correct, 1-2 sentences"}]
Make questions practical, India-specific where relevant (UPI, Aadhaar, Indian banks), and varied in difficulty.`,
          },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    // Save to Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/daily_quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ quiz_date: today, topic, questions }),
    });

    return res.status(200).json({ questions, cached: false });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
