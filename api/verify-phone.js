export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }

  try {
    const apiKey = process.env.NUMVERIFY_API_KEY;
    
    // Clean number — sirf digits
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    
    const response = await fetch(
      `http://apilayer.net/api/validate?access_key=${apiKey}&number=${cleaned}&country_code=IN&format=1`
    );
    
    const data = await response.json();
    
    return res.status(200).json({
      valid: data.valid,
      number: data.number,
      carrier: data.carrier,
      lineType: data.line_type,
      location: data.location,
      countryCode: data.country_code,
    });

  } catch (err) {
    return res.status(500).json({ 
      error: "NumVerify API failed", 
      detail: err.message 
    });
  }
}
