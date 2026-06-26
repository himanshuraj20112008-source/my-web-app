export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, system } = req.body;

  try {
    const groqMessages = [];
    if (system) {
      groqMessages.push({ role: "system", content: system });
    }
    messages.forEach((m) => groqMessages.push({ role: m.role, content: m.content }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(200).json({ text: "Error: " + JSON.stringify(data) });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Groq API failed", detail: err.message });
  }
}
