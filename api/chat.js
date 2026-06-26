export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, system } = req.body;

  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = { contents };
    if (system) {
      body.system_instruction = { parts: [{ text: system }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    
    console.log("Gemini raw response:", JSON.stringify(data));
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return res.status(200).json({ text: "Error: " + JSON.stringify(data) });
    }
    
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Gemini API failed", detail: err.message });
  }
}
