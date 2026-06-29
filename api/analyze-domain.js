import https from "https";
import dns from "dns/promises";
import tls from "tls";

// ── Helper: VirusTotal Domain Lookup ─────────────────────────────────────────
async function checkVirusTotal(domain) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { available: false, reason: "No API key configured" };

  return new Promise((resolve) => {
    const options = {
      hostname: "www.virustotal.com",
      path: `/api/v3/domains/${encodeURIComponent(domain)}`,
      method: "GET",
      headers: { "x-apikey": apiKey, "Accept": "application/json" },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);
          if (json.error) return resolve({ available: false, reason: json.error.message });

          const stats = json.data?.attributes?.last_analysis_stats || {};
          const votes = json.data?.attributes?.total_votes || {};
          const categories = json.data?.attributes?.categories || {};
          const reputation = json.data?.attributes?.reputation ?? null;
          const creationDate = json.data?.attributes?.creation_date ?? null;

          const malicious = stats.malicious || 0;
          const suspicious = stats.suspicious || 0;
          const harmless = stats.harmless || 0;
          const undetected = stats.undetected || 0;
          const total = malicious + suspicious + harmless + undetected;

          resolve({
            available: true,
            malicious, suspicious, harmless, undetected, total,
            reputation,
            categories: Object.values(categories).slice(0, 4),
            creationDate: creationDate
              ? new Date(creationDate * 1000).toISOString().split("T")[0]
              : null,
            communityMalicious: votes.malicious || 0,
            communityHarmless: votes.harmless || 0,
          });
        } catch {
          resolve({ available: false, reason: "Parse error" });
        }
      });
    });

    req.on("error", (e) => resolve({ available: false, reason: e.message }));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ available: false, reason: "Timeout" });
    });
    req.end();
  });
}

// ── Helper: WHOIS via RDAP (free, no key needed) ─────────────────────────────
async function checkWHOIS(domain) {
  return new Promise((resolve) => {
    const options = {
      hostname: "rdap.org",
      path: `/v1/domain/${encodeURIComponent(domain)}`,
      method: "GET",
      headers: { "Accept": "application/json" },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);

          let registered = null, updated = null, expires = null, registrar = null;

          for (const ev of json.events || []) {
            if (ev.eventAction === "registration") registered = ev.eventDate?.split("T")[0];
            if (ev.eventAction === "last changed") updated = ev.eventDate?.split("T")[0];
            if (ev.eventAction === "expiration") expires = ev.eventDate?.split("T")[0];
          }

          for (const ent of json.entities || []) {
            if (ent.roles?.includes("registrar")) {
              registrar = ent.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3] || null;
            }
          }

          const status = (json.status || []).slice(0, 3);

          let ageDays = null, ageLabel = null;
          if (registered) {
            ageDays = Math.floor((Date.now() - new Date(registered)) / (1000 * 60 * 60 * 24));
            ageLabel =
              ageDays < 30   ? "🔴 Very New (<30 days)" :
              ageDays < 90   ? "🟠 New (<90 days)" :
              ageDays < 365  ? "🟡 Moderate (<1 year)" :
              ageDays < 730  ? "🟢 Established (1-2 years)" :
                               "✅ Old & Established (2+ years)";
          }

          resolve({
            available: true,
            registered, updated, expires,
            registrar: registrar || "Unknown",
            status, ageDays, ageLabel,
          });
        } catch {
          resolve({ available: false, reason: "RDAP parse error" });
        }
      });
    });

    req.on("error", (e) => resolve({ available: false, reason: e.message }));
    req.setTimeout(6000, () => {
      req.destroy();
      resolve({ available: false, reason: "WHOIS timeout" });
    });
    req.end();
  });
}

// ── Helper: SSL Certificate Check ────────────────────────────────────────────
async function checkSSL(domain) {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(443, domain, { servername: domain, rejectUnauthorized: false }, () => {
        try {
          const cert = socket.getPeerCertificate();
          socket.destroy();

          if (!cert || !cert.subject) {
            return resolve({ available: false, hasSSL: false, reason: "No certificate found" });
          }

          const validTo   = cert.valid_to   ? new Date(cert.valid_to).toISOString().split("T")[0]   : null;
          const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString().split("T")[0] : null;
          const daysLeft  = validTo ? Math.floor((new Date(validTo) - Date.now()) / (1000 * 60 * 60 * 24)) : null;
          const issuer    = cert.issuer?.O || cert.issuer?.CN || "Unknown";
          const isExpired = daysLeft !== null && daysLeft < 0;
          const isSelfSigned = cert.issuer?.CN === cert.subject?.CN;
          const isTrustedIssuer = ["Let's Encrypt","DigiCert","Comodo","GlobalSign","Sectigo","GeoTrust","Thawte"]
            .some(ca => issuer.includes(ca));

          resolve({
            available: true, hasSSL: true,
            validFrom, validTo, daysLeft,
            issuer, isExpired, isSelfSigned, isTrustedIssuer,
            subject: cert.subject?.CN || domain,
          });
        } catch (e) {
          socket.destroy();
          resolve({ available: false, hasSSL: false, reason: "Cert parse error" });
        }
      });

      socket.on("error", (e) => resolve({ available: false, hasSSL: false, reason: e.message }));
      socket.setTimeout(5000, () => {
        socket.destroy();
        resolve({ available: false, hasSSL: false, reason: "SSL timeout" });
      });
    } catch (e) {
      resolve({ available: false, hasSSL: false, reason: e.message });
    }
  });
}

// ── Helper: DNS Records ───────────────────────────────────────────────────────
async function checkDNS(domain) {
  try {
    const [aRecords, nsRecords, txtRecords] = await Promise.allSettled([
      dns.resolve4(domain).catch(() => []),
      dns.resolveNs(domain).catch(() => []),
      dns.resolveTxt(domain).catch(() => []),
    ]);

    const a   = aRecords.status   === "fulfilled" ? aRecords.value   : [];
    const ns  = nsRecords.status  === "fulfilled" ? nsRecords.value  : [];
    const txt = txtRecords.status === "fulfilled"
      ? txtRecords.value.map(r => r.join("")).slice(0, 3)
      : [];

    return {
      available: true,
      aRecords:  a.slice(0, 3),
      nsRecords: ns.slice(0, 3),
      hasSPF:    txt.some(r => r.startsWith("v=spf1")),
      hasDMARC:  txt.some(r => r.includes("v=DMARC1")),
      isIPv4:    a.length > 0,
    };
  } catch {
    return { available: false };
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  let domain = "";
  try {
    domain = (req.body?.domain || "")
      .trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split("?")[0];
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (!domain || domain.length < 3) {
    return res.status(400).json({ error: "Invalid domain" });
  }

  try {
    const [vtResult, whoisResult, sslResult, dnsResult] = await Promise.all([
      checkVirusTotal(domain),
      checkWHOIS(domain),
      checkSSL(domain),
      checkDNS(domain),
    ]);

    return res.status(200).json({
      domain,
      virusTotal: vtResult,
      whois:      whoisResult,
      ssl:        sslResult,
      dns:        dnsResult,
    });
  } catch (err) {
    return res.status(500).json({ error: "Analysis failed", detail: err.message });
  }
}
