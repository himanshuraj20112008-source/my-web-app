import { useState, useEffect, useRef } from "react";

const SAFE_BROWSING_API = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

// ── Utility helpers ──────────────────────────────────────────────────────────

function entropyScore(str) {
  const freq = {};
  for (const c of str) freq[c] = (freq[c] || 0) + 1;
  const len = str.length;
  return -Object.values(freq).reduce((s, f) => {
    const p = f / len;
    return s + p * Math.log2(p);
  }, 0);
}

function extractDomain(url) {
  try {
    return new URL(url.startsWith("http") ? url : "https://" + url).hostname;
  } catch {
    return url;
  }
}

// ── Google Safe Browsing API call ─────────────────────────────────────────────

async function checkGoogleSafeBrowsing(url) {
  const apiKey = import.meta.env.VITE_GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) return { status: "no_key", threats: [] };

  const body = {
    client: { clientId: "sentinelx", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const res = await fetch(`${SAFE_BROWSING_API}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.matches && data.matches.length > 0) {
      return { status: "danger", threats: data.matches.map((m) => m.threatType) };
    }
    return { status: "safe", threats: [] };
  } catch {
    return { status: "error", threats: [] };
  }
}

// ── Local heuristic engine ───────────────────────────────────────────────────

const BLACKLIST = ["paypal-secure", "amazon-login", "google-verify", "bank-update", "free-bitcoin", "account-suspended", "verify-now", "lucky-winner"];
const WHITELIST = ["google.com", "github.com", "microsoft.com", "amazon.com", "youtube.com", "linkedin.com", "wikipedia.org", "stackoverflow.com"];
const SUSPICIOUS_TLDS = [".xyz", ".top", ".club", ".win", ".loan", ".gq", ".ml", ".cf", ".tk"];
const PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "update", "confirm", "banking", "password", "signin", "suspend"];

function analyzeURL(raw) {
  if (!raw || raw.trim() === "") return null;
  const url = raw.trim();
  let risk = 0;
  const flags = [];

  const domain = extractDomain(url);
  if (WHITELIST.some((w) => domain.endsWith(w))) {
    return { score: 5, level: "SAFE", flags: ["✅ Trusted domain"], color: "#00ff88", icon: "🛡️" };
  }

  if (BLACKLIST.some((b) => url.toLowerCase().includes(b))) { risk += 60; flags.push("🚨 Known phishing pattern"); }
  if (SUSPICIOUS_TLDS.some((t) => domain.endsWith(t))) { risk += 30; flags.push("⚠️ Suspicious TLD"); }
  if (/\d{1,3}(\.\d{1,3}){3}/.test(domain)) { risk += 40; flags.push("🔴 IP address used as domain"); }
  if ((url.match(/-/g) || []).length > 3) { risk += 20; flags.push("⚠️ Excessive hyphens"); }
  if (url.length > 100) { risk += 15; flags.push("⚠️ Unusually long URL"); }
  const entropy = entropyScore(domain);
  if (entropy > 4.2) { risk += 25; flags.push("🔴 High entropy — looks auto-generated"); }
  const kwMatches = PHISHING_KEYWORDS.filter((k) => url.toLowerCase().includes(k));
  if (kwMatches.length >= 2) { risk += kwMatches.length * 10; flags.push(`⚠️ Phishing keywords: ${kwMatches.join(", ")}`); }
  if (!url.startsWith("https://")) { risk += 15; flags.push("⚠️ No HTTPS"); }
  if ((url.match(/\./g) || []).length > 5) { risk += 20; flags.push("⚠️ Too many subdomains"); }

  const score = Math.max(0, Math.min(100, 100 - risk));
  let level, color, icon;
  if (score >= 75) { level = "SAFE"; color = "#00ff88"; icon = "✅"; }
  else if (score >= 50) { level = "MODERATE"; color = "#ffd700"; icon = "⚠️"; }
  else if (score >= 25) { level = "HIGH RISK"; color = "#ff8c00"; icon = "🔶"; }
  else { level = "CRITICAL"; color = "#ff2d55"; icon = "🚨"; }

  if (flags.length === 0) flags.push("✅ No suspicious patterns found");
  return { score, level, flags, color, icon };
}

// ── Phone analysis ────────────────────────────────────────────────────────────

function analyzePhone(phone) {
  if (!phone || phone.trim() === "") return null;
  const cleaned = phone.replace(/[\s\-().+]/g, "");
  const flags = [];
  let risk = 0;

  if (!/^\d+$/.test(cleaned)) { flags.push("🔴 Contains non-numeric characters"); risk += 30; }
  if (cleaned.length < 7 || cleaned.length > 15) { flags.push("⚠️ Invalid length"); risk += 40; }
  if (/^(.)\1{6,}$/.test(cleaned)) { flags.push("🚨 Repeated digits — fake number"); risk += 70; }
  if (cleaned.startsWith("0000") || cleaned === "1234567890") { flags.push("🚨 Sequential/fake number"); risk += 80; }
  if (phone.startsWith("+91") && cleaned.length !== 12) { flags.push("⚠️ Invalid Indian mobile length"); risk += 30; }
  if (phone.startsWith("+91")) {
    const local = cleaned.slice(2);
    if (!/^[6-9]/.test(local)) { flags.push("🔴 Invalid Indian mobile prefix"); risk += 40; }
  }

  const score = Math.max(0, Math.min(100, 100 - risk));
  let level, color, icon;
  if (score >= 75) { level = "VALID"; color = "#00ff88"; icon = "✅"; }
  else if (score >= 50) { level = "SUSPICIOUS"; color = "#ffd700"; icon = "⚠️"; }
  else { level = "FAKE/INVALID"; color = "#ff2d55"; icon = "🚨"; }

  if (flags.length === 0) flags.push("✅ Number appears valid");
  return { score, level, flags, color, icon };
}

// ── Email analysis ─────────────────────────────────────────────────────────────

const DISPOSABLE = ["mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com", "throwaway.email", "yopmail.com", "fakeinbox.com", "trashmail.com"];

function analyzeEmail(email) {
  if (!email || email.trim() === "") return null;
  const flags = [];
  let risk = 0;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { flags.push("🔴 Invalid email format"); risk += 80; }
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (DISPOSABLE.includes(domain)) { flags.push("🚨 Disposable email provider"); risk += 70; }
  if (email.length > 254) { flags.push("⚠️ Email too long"); risk += 20; }
  if (/\.\./.test(email)) { flags.push("🔴 Consecutive dots"); risk += 30; }
  if (/[<>()[\]\\,;:]/.test(email)) { flags.push("🔴 Invalid special characters"); risk += 40; }
  const local = email.split("@")[0];
  if (local.length < 2) { flags.push("⚠️ Very short local part"); risk += 20; }
  const entropy = entropyScore(local);
  if (entropy > 4.5 && local.length > 12) { flags.push("⚠️ Random-looking username"); risk += 20; }

  const score = Math.max(0, Math.min(100, 100 - risk));
  let level, color, icon;
  if (score >= 75) { level = "LEGITIMATE"; color = "#00ff88"; icon = "✅"; }
  else if (score >= 50) { level = "SUSPICIOUS"; color = "#ffd700"; icon = "⚠️"; }
  else { level = "FAKE/INVALID"; color = "#ff2d55"; icon = "🚨"; }

  if (flags.length === 0) flags.push("✅ Email appears legitimate");
  return { score, level, flags, color, icon };
}

// ── UPI analysis ──────────────────────────────────────────────────────────────

const LEGIT_UPI = ["@okaxis", "@okhdfcbank", "@okicici", "@oksbi", "@paytm", "@ybl", "@ibl", "@axl", "@upi", "@freecharge", "@apl", "@allbank"];

function analyzeUPI(upi) {
  if (!upi || upi.trim() === "") return null;
  const flags = [];
  let risk = 0;

  if (!upi.includes("@")) { flags.push("🔴 Missing @ symbol"); risk += 80; }
  const parts = upi.split("@");
  if (parts.length !== 2) { flags.push("🔴 Invalid UPI format"); risk += 80; }
  const handle = "@" + (parts[1] || "").toLowerCase();
  if (!LEGIT_UPI.includes(handle)) { flags.push("⚠️ Unknown UPI handle"); risk += 30; }
  else { flags.push(`✅ Recognized handle: ${handle}`); }
  if ((parts[0] || "").length < 3) { flags.push("⚠️ VPA too short"); risk += 20; }
  const phishWords = ["refund", "cashback", "prize", "lucky", "winner", "reward"];
  if (phishWords.some((w) => upi.toLowerCase().includes(w))) { flags.push("🚨 Scam keyword in UPI ID"); risk += 60; }

  const score = Math.max(0, Math.min(100, 100 - risk));
  let level, color, icon;
  if (score >= 75) { level = "LEGITIMATE"; color = "#00ff88"; icon = "✅"; }
  else if (score >= 50) { level = "SUSPICIOUS"; color = "#ffd700"; icon = "⚠️"; }
  else { level = "FAKE/SCAM"; color = "#ff2d55"; icon = "🚨"; }

  if (flags.length === 0) flags.push("✅ UPI ID looks valid");
  return { score, level, flags, color, icon };
}

// ── Risk Meter Component ──────────────────────────────────────────────────────

function RiskMeter({ score, color }) {
  return (
    <div style={{ margin: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#aaa" }}>
        <span>Risk Score</span>
        <span style={{ color, fontWeight: 700 }}>{score}/100</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${score}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 10px ${color}66`,
        }} />
      </div>
    </div>
  );
}

// ── Google Badge Component ────────────────────────────────────────────────────

function GoogleBadge({ result }) {
  if (!result) return null;
  if (result.status === "no_key") return (
    <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: "rgba(255,200,0,0.1)", border: "1px solid rgba(255,200,0,0.3)", fontSize: 13, color: "#ffd700" }}>
      ⚠️ Google Safe Browsing key not configured
    </div>
  );
  if (result.status === "error") return (
    <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: "rgba(255,100,0,0.1)", border: "1px solid rgba(255,100,0,0.3)", fontSize: 13, color: "#ff8c00" }}>
      ⚠️ Google Safe Browsing check failed
    </div>
  );
  if (result.status === "danger") return (
    <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(255,45,85,0.15)", border: "2px solid #ff2d55", fontSize: 14 }}>
      <div style={{ fontWeight: 700, color: "#ff2d55", marginBottom: 4 }}>🚨 GOOGLE FLAGGED THIS URL!</div>
      <div style={{ color: "#ffaabb", fontSize: 13 }}>Threat types: {result.threats.join(", ")}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>🛡️ Powered by Google Safe Browsing</div>
    </div>
  );
  return (
    <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", fontSize: 13 }}>
      <div style={{ fontWeight: 600, color: "#00ff88" }}>✅ Google Safe Browsing: No threats detected</div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#888" }}>🛡️ Powered by Google Safe Browsing</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#e6edf3",
  },
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", padding: "0 24px", height: 64, gap: 8,
  },
  logo: { fontSize: 22, fontWeight: 800, color: "#00d4ff", letterSpacing: -0.5, marginRight: "auto" },
  navBtn: (active) => ({
    padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: active ? "rgba(0,212,255,0.15)" : "transparent",
    color: active ? "#00d4ff" : "#8b949e",
    transition: "all .2s",
  }),
  hero: {
    textAlign: "center", padding: "80px 24px 60px",
    background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,212,255,0.08) 0%, transparent 70%)",
  },
  heroTitle: {
    fontSize: "clamp(32px, 6vw, 58px)", fontWeight: 900, letterSpacing: -1.5,
    background: "linear-gradient(135deg, #ffffff 30%, #00d4ff 70%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16,
  },
  heroSub: { fontSize: 17, color: "#8b949e", maxWidth: 540, margin: "0 auto 36px" },
  card: {
    background: "rgba(22,27,34,0.8)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 28, backdropFilter: "blur(12px)",
  },
  input: {
    width: "100%", padding: "14px 18px", borderRadius: 10, fontSize: 15,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#e6edf3", outline: "none", boxSizing: "border-box",
    transition: "border .2s",
  },
  btn: (color = "#00d4ff") => ({
    padding: "13px 28px", borderRadius: 10, border: "none", cursor: "pointer",
    background: `linear-gradient(135deg, ${color}, ${color}bb)`,
    color: color === "#00d4ff" ? "#0a0a0f" : "#fff",
    fontWeight: 700, fontSize: 15, transition: "all .2s",
    boxShadow: `0 4px 20px ${color}33`,
  }),
  statCard: {
    background: "rgba(22,27,34,0.6)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: "20px 24px", textAlign: "center",
  },
  flagItem: {
    padding: "8px 14px", borderRadius: 8, marginBottom: 6,
    background: "rgba(255,255,255,0.04)", fontSize: 13, color: "#c9d1d9",
  },
};

// ── Pages ─────────────────────────────────────────────────────────────────────

function HomePage({ setPage }) {
  const stats = [
    { n: "2.4M+", l: "Total Scans" },
    { n: "153K+", l: "Threats Detected" },
    { n: "98K+", l: "Users Protected" },
    { n: "45+", l: "Intel Sources" },
  ];
  return (
    <div>
      <div style={S.hero}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#00d4ff", textTransform: "uppercase", marginBottom: 16, opacity: .7 }}>
          AI-POWERED THREAT INTELLIGENCE
        </div>
        <h1 style={S.heroTitle}>Think Before You Click.</h1>
        <p style={S.heroSub}>
          Real-time cyber threat detection — URLs, emails, phone numbers & UPI IDs analyzed instantly.
          Now powered by Google Safe Browsing.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={S.btn()} onClick={() => setPage("scanner")}>🔍 Analyze Now</button>
          <button style={{ ...S.btn(), background: "rgba(255,255,255,0.06)", color: "#e6edf3", boxShadow: "none" }} onClick={() => setPage("learn")}>
            📚 Learn Cyber Safety
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, maxWidth: 700, margin: "0 auto 60px", padding: "0 24px" }}>
        {stats.map(({ n, l }) => (
          <div key={l} style={S.statCard}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#00d4ff" }}>{n}</div>
            <div style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScannerPage() {
  const [tab, setTab] = useState("url");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [gsbResult, setGsbResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const TABS = [
    { id: "url", label: "🔗 URL" },
    { id: "email", label: "📧 Email" },
    { id: "phone", label: "📱 Phone" },
    { id: "upi", label: "💳 UPI" },
  ];

  async function handleScan() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setGsbResult(null);

    await new Promise((r) => setTimeout(r, 600));

    let res;
    if (tab === "url") res = analyzeURL(input);
    else if (tab === "email") res = analyzeEmail(input);
    else if (tab === "phone") res = analyzePhone(input);
    else res = analyzeUPI(input);

    setResult(res);

    if (tab === "url" && res) {
      const gsb = await checkGoogleSafeBrowsing(input.startsWith("http") ? input : "https://" + input);
      setGsbResult(gsb);
      if (gsb.status === "danger") {
        res = { ...res, score: Math.min(res.score, 10), level: "CRITICAL", color: "#ff2d55", icon: "🚨" };
        setResult(res);
      }
    }

    setHistory((h) => [{ tab, input, level: res?.level, time: new Date().toLocaleTimeString() }, ...h.slice(0, 9)]);
    setLoading(false);
  }

  const placeholders = { url: "e.g. https://example.com or paypal-secure-login.xyz", email: "e.g. user@gmail.com", phone: "e.g. +91 98765 43210", upi: "e.g. username@okaxis" };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>🔍 Threat Scanner</h2>
      <p style={{ color: "#8b949e", marginBottom: 28, fontSize: 14 }}>Analyze URLs with real Google Safe Browsing + local heuristics</p>

      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => { setTab(id); setResult(null); setGsbResult(null); setInput(""); }}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tab === id ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.05)",
                color: tab === id ? "#00d4ff" : "#8b949e" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder={placeholders[tab]} style={S.input} />
          <button onClick={handleScan} style={{ ...S.btn(), whiteSpace: "nowrap" }} disabled={loading}>
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#00d4ff" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 14 }}>{tab === "url" ? "Checking Google Safe Browsing + local analysis..." : "Analyzing..."}</div>
          </div>
        )}

        {result && !loading && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>{result.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: result.color }}>{result.level}</div>
                <div style={{ fontSize: 13, color: "#8b949e" }}>Confidence score</div>
              </div>
            </div>
            <RiskMeter score={result.score} color={result.color} />
            {tab === "url" && <GoogleBadge result={gsbResult} />}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#8b949e", marginBottom: 8 }}>ANALYSIS FLAGS</div>
              {result.flags.map((f, i) => <div key={i} style={S.flagItem}>{f}</div>)}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div style={S.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#8b949e" }}>SCAN HISTORY</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: 13 }}>
              <span style={{ color: "#c9d1d9", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.input}</span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}>{h.tab.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: "#8b949e" }}>{h.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LearnPage() {
  const tips = [
    { icon: "🔗", title: "Check URLs carefully", body: "Phishing sites often use typos like 'paypa1.com' instead of 'paypal.com'. Always verify the domain before clicking." },
    { icon: "🔒", title: "HTTPS ≠ Safe", body: "A site can have HTTPS and still be malicious. HTTPS only means the connection is encrypted, not that the site is trustworthy." },
    { icon: "📧", title: "Email spoofing", body: "Attackers send emails pretending to be your bank or Google. Always check the sender's actual email address, not just the display name." },
    { icon: "💸", title: "UPI Scams", body: "Never accept a 'payment request' to receive money — that's how UPI scams work. You never need to enter PIN to receive money." },
    { icon: "📱", title: "OTP is sacred", body: "No legitimate company will ever ask for your OTP over a call. Anyone asking for OTP is a scammer, 100% of the time." },
    { icon: "🧠", title: "Social Engineering", body: "Attackers create urgency: 'Your account will be blocked in 2 hours!' Real companies don't operate this way." },
  ];
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>📚 Cyber Safety Guide</h2>
      <p style={{ color: "#8b949e", marginBottom: 32, fontSize: 14 }}>Essential knowledge every student needs to stay safe online</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {tips.map(({ icon, title, body }) => (
          <div key={title} style={{ ...S.card, borderTop: "2px solid rgba(0,212,255,0.3)" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{title}</div>
            <div style={{ fontSize: 14, color: "#8b949e", lineHeight: 1.6 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardPage() {
  const data = [
    { label: "URL Scans", value: 68, color: "#00d4ff" },
    { label: "Email Checks", value: 18, color: "#7c3aed" },
    { label: "Phone Checks", value: 9, color: "#00ff88" },
    { label: "UPI Checks", value: 5, color: "#ffd700" },
  ];
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>📊 Threat Dashboard</h2>
      <p style={{ color: "#8b949e", marginBottom: 32, fontSize: 14 }}>Global scan distribution & threat intelligence overview</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>Scan Distribution</div>
          {data.map(({ label, value, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#c9d1d9" }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{value}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${value}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>🛡️ Google Safe Browsing</div>
          <div style={{ fontSize: 14, color: "#8b949e", lineHeight: 1.8 }}>
            <div>✅ Real-time URL threat detection</div>
            <div>✅ Malware database check</div>
            <div>✅ Phishing site detection</div>
            <div>✅ Unwanted software detection</div>
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", fontSize: 13, color: "#00d4ff" }}>
              🔗 Powered by Google Safe Browsing API v4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");

  const PAGES = [
    { id: "home", label: "Home" },
    { id: "scanner", label: "Scanner" },
    { id: "dashboard", label: "Dashboard" },
    { id: "learn", label: "Learn" },
  ];

  return (
    <div style={S.app}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0f; }
        input::placeholder { color: #4a5568; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        button:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <nav style={S.nav}>
        <div style={S.logo}>⬡ SentinelX</div>
        {PAGES.map(({ id, label }) => (
          <button key={id} style={S.navBtn(page === id)} onClick={() => setPage(id)}>{label}</button>
        ))}
      </nav>

      {page === "home" && <HomePage setPage={setPage} />}
      {page === "scanner" && <ScannerPage />}
      {page === "dashboard" && <DashboardPage />}
      {page === "learn" && <LearnPage />}
    </div>
  );
}
