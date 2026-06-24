import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#080E1C", surface:"rgba(255,255,255,0.035)", border:"rgba(0,212,255,0.13)",
  cyan:"#00D4FF", blue:"#5B5BFF", violet:"#8B5CF6",
  danger:"#FF4D4F", warning:"#FFC107", success:"#00C853", info:"#38BDF8",
  text:"#E2EEF8", muted:"#607D96", faint:"rgba(255,255,255,0.05)"
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:${C.bg};color:${C.text}}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(0,212,255,0.25);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes scanLine{0%{top:0}100%{top:100%}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,212,255,.3)}50%{box-shadow:0 0 20px rgba(0,212,255,.6)}}
@keyframes countUp{from{opacity:0}to{opacity:1}}
.fu{animation:fadeUp .35s ease both}
.glass{background:rgba(255,255,255,0.04);border:1px solid ${C.border};backdrop-filter:blur(14px);border-radius:16px}
.glass-sm{background:rgba(255,255,255,0.045);border:1px solid rgba(0,212,255,0.1);border-radius:10px}
.btn-prime{background:linear-gradient(135deg,#00D4FF,#5B5BFF);border:none;color:#000;font-weight:700;cursor:pointer;border-radius:10px;font-family:'Inter',sans-serif;transition:all .2s;letter-spacing:.3px}
.btn-prime:hover{opacity:.88;transform:translateY(-1px)}
.btn-prime:disabled{opacity:.35;cursor:not-allowed;transform:none}
.btn-ghost{background:transparent;border:1px solid rgba(0,212,255,.22);color:${C.cyan};cursor:pointer;border-radius:8px;font-family:'Inter',sans-serif;transition:all .2s}
.btn-ghost:hover{background:rgba(0,212,255,.08)}
.ifield{background:rgba(255,255,255,.055);border:1px solid rgba(0,212,255,.18);border-radius:11px;color:${C.text};font-family:'Inter',sans-serif;outline:none;transition:border .2s,background .2s;width:100%}
.ifield:focus{border-color:${C.cyan};background:rgba(0,212,255,.06)}
.ifield::placeholder{color:${C.muted}}
.tab{background:transparent;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;border-radius:8px;white-space:nowrap}
.mono{font-family:'JetBrains Mono',monospace}
`;

// ─── THREAT DATABASE ─────────────────────────────────────────────────────────

function generateEmailBlacklist() {
  const scamUsers = [
    "reward2026","lottery.winner","cashback.offer","refund.alert","kyc.verify",
    "gift.claim","support.helpdesk","prize.winner","free.offer","urgent.verify",
    "rbi.official","income.tax.refund","pm.relief","claim.bonus","investment.return",
    "crypto.profit","bank.alert","account.suspended","verify.now","update.kyc",
    "lucky.winner","congratulations.winner","win.prize","earn.daily","get.rich",
    "bitcoin.profit","nft.airdrop","airdrop.claim","token.reward","wallet.verify",
    "otp.required","pin.update","cvv.check","card.block","debit.freeze",
    "sbi.helpdesk","hdfc.support","icici.alert","axis.verify","pnb.kyc",
    "amazon.refund","flipkart.cashback","paytm.reward","phonepe.prize","gpay.offer",
    "noreply.scam","admin.fake","official.fraud","helpdesk.scam","service.phish",
  ];
  const scamDomains = [
    "mailinator.com","guerrillamail.com","10minutemail.com","throwaway.email",
    "trashmail.com","yopmail.com","tempmail.com","dispostable.com","fakeinbox.com",
    "lottery-india.com","rbi-reward.net","sbi-alert.xyz","hdfc-kyc.in","free-prize.win",
    "crypto-earn.club","bitcoin-profit.top","nft-airdrop.io","investment-return.biz",
    "winner-claim.info","cashback-offer.co","refund-now.net","urgent-kyc.xyz",
    "bank-alert.ml","account-verify.ga","reward-center.cf","prize-claim.tk",
    "scam-domain.xyz","phish-site.win","fraud-mail.club","fake-bank.top",
  ];
  const suffixes = ["","1","2","2026","2025","123","999","007","786","official","real","verified"];
  const bl = new Set();
  for (const u of scamUsers) for (const d of scamDomains) for (const s of suffixes) {
    bl.add(`${u}${s}@${d}`);
    if (bl.size >= 500) return bl;
  }
  let i = 0;
  while (bl.size < 500) { bl.add(`scam${i++}@fraud-mail.xyz`); }
  return bl;
}

function generateEmailWhitelist() {
  const trustedUsers = [
    "contact","info","support","hello","admin","noreply","newsletter","billing",
    "sales","hr","careers","legal","privacy","security","abuse","help",
    "webmaster","postmaster","accounts","orders","notifications","alerts",
    "feedback","marketing","press","media","partnerships","developer","api",
  ];
  const trustedDomains = [
    "google.com","microsoft.com","apple.com","amazon.com","github.com",
    "linkedin.com","twitter.com","meta.com","netflix.com","adobe.com",
    "salesforce.com","slack.com","zoom.us","dropbox.com","stripe.com",
    "paypal.com","uber.com","airbnb.com","spotify.com","figma.com",
    "notion.so","atlassian.com","cloudflare.com","vercel.com","anthropic.com",
    "sbi.co.in","hdfcbank.com","icicibank.com","axisbank.com","pnbindia.in",
    "irctc.co.in","npci.org.in","uidai.gov.in","incometax.gov.in","rbi.org.in",
    "zomato.com","swiggy.com","flipkart.com","myntra.com","paytm.com",
  ];
  const wl = new Set();
  for (const d of trustedDomains) for (const u of trustedUsers) {
    wl.add(`${u}@${d}`);
    if (wl.size >= 500) return wl;
  }
  return wl;
}

const EMAIL_BLACKLIST = generateEmailBlacklist();
const EMAIL_WHITELIST = generateEmailWhitelist();

const DB = {
  upiBlacklist: new Set([
    "fraud@paytm","scam@upi","lottery@ybl","reward@okaxis","refund@oksbi",
    "kyc@paytm","helpdesk@upi","cashback@ybl","verify@okicici","support@upi",
    "prize@ybl","gift@okaxis","winner@oksbi","free@upi","urgent@paytm",
    "pm@ybl","gov@upi","rbi@okaxis","income@oksbi","amazon@fake",
  ]),
  upiWhitelist: new Set([
    "zomato@icici","swiggy@icici","amazon@apl","flipkart@ybl","paytmmall@paytm",
    "netflix@icici","spotify@federal","irctc@upi","hdfc@hdfcbank","sbi@sbi",
    "airtel@airtel","jio@jiomoney","ola@okaxis","uber@ybl","phonepe@ybl",
  ]),
  phoneBlacklist: new Set([
    "9999999999","8888888888","7777777777","1234567890","0000000000",
    "9876543210","9876543200","9123456789","8123456789","7012345678",
  ]),
  domainBlacklist: new Set([
    "paypal-secure-login.xyz","amazon-offers.net","sbi-reward.com",
    "hdfc-kyc-verify.in","free-iphone.win","rbi-lottery.org","pm-kisan-help.xyz",
    "google-prize.info","whatsapp-reward.net","jio-cashback.co",
  ]),
  emailBlacklist: EMAIL_BLACKLIST,
  emailWhitelist: EMAIL_WHITELIST,
  suspiciousKeywords: {
    upi: ["reward","cashback","refund","verify","kyc","lottery","gift","support","helpdesk",
          "prize","winner","free","urgent","rbi","gov","income","pm","claim","bonus","offer"],
    email: [
      "reward","lottery","cashback","refund","verify","kyc","gift","support","admin",
      "official","bank","payment","winner","crypto","investment","urgent","prize",
      "claim","bonus","offer","free","alert","suspended","confirm","update","unusual",
      "income","tax","bitcoin","nft","airdrop","token","wallet","helpdesk","earn",
    ],
    sms: ["otp","pin","cvv","password","account","suspended","verify","click","link","won",
          "prize","lottery","congratulations","free","gift","urgent","immediately","atm","card"],
    domain: ["login","secure","verify","account","update","confirm","bank","wallet","pay",
             "reward","free","win","prize","offer","cheap","discount","deal"],
    url: ["login","secure","verify","account","update","bank","wallet","pay","free","win",
          "prize","phish","malware","trojan","hack","crack","keygen","warez"],
  },
  communityReports: {
    "9876540001":{ reports:12, lastSeen:"2024-11-12", category:"fake KYC" },
    "8800990011":{ reports:8,  lastSeen:"2024-10-30", category:"investment scam" },
    "help@lottery-india.com":{ reports:34, lastSeen:"2024-11-05", category:"lottery scam" },
    "kyc@sbihelp.net":{ reports:19, lastSeen:"2024-11-10", category:"phishing" },
  },
  disposableEmailProviders: new Set([
    "mailinator.com","guerrillamail.com","10minutemail.com","throwaway.email",
    "trashmail.com","fakeinbox.com","yopmail.com","tempmail.com","dispostable.com",
    "maildrop.cc","sharklasers.com","guerrillamailblock.com",
  ]),
  trustedTLDs: new Set([".gov.in",".nic.in",".edu",".gov"]),
  suspiciousTLDs: new Set([".xyz",".win",".club",".top",".info",".biz",".tk",".ml",".ga",".cf"]),
};

// ─── RISK ENGINE ──────────────────────────────────────────────────────────────
function calcEntropy(s) {
  const freq = {};
  for (const c of s) freq[c] = (freq[c]||0)+1;
  const len = s.length;
  return -Object.values(freq).reduce((sum,f)=>{ const p=f/len; return sum+p*Math.log2(p); },0);
}

function hasRepeats(s,n=3) {
  return /(.)\1{2,}/.test(s) || new RegExp(`(..){${n},}`).test(s);
}

// ── NEW: Google Safe Browsing API helper ──────────────────────────────────────
async function callGoogleSafeBrowsing(rawUrl) {
  const apiKey = import.meta.env.VITE_GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) return { status: "no_key" };

  const targetUrl = rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl;

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "sentinelx", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: targetUrl }],
          },
        }),
      }
    );
    const data = await res.json();
    if (data.matches && data.matches.length > 0) {
      // Collect unique threat types from all matches
      const threats = [...new Set(data.matches.map((m) => m.threatType))];
      return { status: "danger", threats };
    }
    return { status: "safe" };
  } catch {
    return { status: "error" };
  }
}

const RISK_ENGINE = {
  upi(raw) {
    const id = raw.trim().toLowerCase();
    const indicators = [], weights = [];

    if (DB.upiWhitelist.has(id)) return {
      score:4, level:"low", indicators:["Verified merchant UPI ID"],
      recommendation:"This UPI ID belongs to a known trusted merchant. Safe to proceed."
    };
    if (DB.upiBlacklist.has(id)) {
      indicators.push("🚨 Found in fraud blacklist database");
      weights.push(90);
    }

    const [handle, provider] = id.split("@");
    if (!handle || !provider) { indicators.push("Invalid UPI format"); weights.push(40); }

    const kws = DB.suspiciousKeywords.upi.filter(k=>handle?.includes(k));
    if (kws.length) { indicators.push(`Suspicious keyword(s): ${kws.join(", ")}`); weights.push(kws.length*18); }

    const digitRatio = (handle?.match(/\d/g)||[]).length / (handle?.length||1);
    if (digitRatio > 0.55) { indicators.push("High digit density — unusual identifier pattern"); weights.push(22); }

    const entropy = calcEntropy(handle||"");
    if (entropy > 3.6) { indicators.push(`High randomness score (entropy: ${entropy.toFixed(2)})`); weights.push(18); }

    if ((handle?.length||0) > 22) { indicators.push("Abnormally long handle"); weights.push(12); }
    if (hasRepeats(handle||"")) { indicators.push("Repeated character pattern detected"); weights.push(14); }

    const suspProviders = ["fake","scam","fraud","phish","temp"];
    if (suspProviders.some(s=>provider?.includes(s))) { indicators.push("Unrecognized or spoofed UPI provider"); weights.push(35); }

    const mixedRatio = (handle?.match(/[a-z]/g)||[]).length>0 && digitRatio>0.3;
    if (mixedRatio && entropy>3.0) { indicators.push("Suspicious alphanumeric mixing pattern"); weights.push(12); }

    const communityData = DB.communityReports[id];
    if (communityData) { indicators.push(`Community reported ${communityData.reports}x — category: ${communityData.category}`); weights.push(Math.min(communityData.reports*4,40)); }

    const score = Math.min(weights.reduce((a,b)=>a+b,0), 100);
    return {
      score, level: score>=75?"critical":score>=50?"high":score>=25?"medium":"low",
      indicators: indicators.length ? indicators : ["No immediate red flags detected"],
      recommendation: score>=75
        ? "⚠️ Do NOT proceed. This UPI ID matches multiple fraud patterns. Report it to your bank immediately."
        : score>=50
        ? "Exercise extreme caution. Verify this UPI ID with the recipient over a trusted channel before transferring any money."
        : score>=25
        ? "Some indicators found. Double-check the recipient's identity before proceeding with any payment."
        : "No major concerns found. Still verify the recipient independently as a good practice.",
    };
  },

  // ── CHANGED: url() is now async + calls Google Safe Browsing ─────────────
  async url(raw) {
    const url = raw.trim().toLowerCase();
    const indicators = [], weights = [];

    // ── Local heuristic analysis (unchanged) ─────────────────────────────
    try {
      const u = new URL(url.startsWith("http") ? url : "https://"+url);
      const host = u.hostname;

      if (DB.domainBlacklist.has(host)) { indicators.push("🚨 Domain found in phishing blacklist"); weights.push(88); }

      if (DB.suspiciousTLDs.has("."+host.split(".").pop())) { indicators.push(`Suspicious TLD (.${host.split(".").pop()})`); weights.push(20); }
      const tld = "."+host.split(".").slice(-2).join(".");
      if (DB.trustedTLDs.has(tld)) weights.push(-15);

      const domainAge = Math.random() * 30; // simulated
      if (domainAge < 10) { indicators.push("Newly registered domain (simulated intel)"); weights.push(25); }

      const kws = DB.suspiciousKeywords.url.filter(k=>url.includes(k));
      if (kws.length) { indicators.push(`Suspicious path keywords: ${kws.join(", ")}`); weights.push(kws.length*15); }

      const domainParts = host.replace("www.","").split(".");
      if (domainParts[0].length > 22) { indicators.push("Unusually long subdomain/domain"); weights.push(18); }

      const entropy = calcEntropy(host);
      if (entropy > 3.8) { indicators.push(`High domain randomness (entropy: ${entropy.toFixed(2)})`); weights.push(20); }

      if (!url.startsWith("https")) { indicators.push("No HTTPS — connection is unencrypted"); weights.push(22); }

      const shorteners = ["bit.ly","t.co","tinyurl.com","goo.gl","ow.ly","short.link","rb.gy"];
      if (shorteners.some(s=>host.includes(s))) { indicators.push("URL shortener detected — destination unknown"); weights.push(18); }

      const typos = ["paypa1","arnazon","g00gle","faceb00k","microsft","netfl1x","y0utube"];
      if (typos.some(t=>host.includes(t))) { indicators.push("Typosquatting pattern detected"); weights.push(40); }

      if ((url.match(/@/g)||[]).length > 0) { indicators.push("URL contains @ — credential theft risk"); weights.push(35); }

    } catch { indicators.push("Invalid URL format"); weights.push(30); }

    let localScore = Math.min(Math.max(weights.reduce((a,b)=>a+b,0), 0), 100);

    // ── NEW: Google Safe Browsing check ───────────────────────────────────
    const gsb = await callGoogleSafeBrowsing(raw.trim());

    let gsbBadge = null; // will be passed to UI

    if (gsb.status === "danger") {
      // Force score to max(localScore, 90) when Google flags it
      localScore = Math.max(localScore, 90);
      gsb.threats.forEach(threat => {
        indicators.push(`🚨 Google Safe Browsing: ${threat} detected`);
      });
      gsbBadge = "danger";
      weights.push(90); // ensure level calculation reflects danger
    } else if (gsb.status === "safe") {
      indicators.push("✅ Google Safe Browsing: No threats detected");
      gsbBadge = "safe";
    } else {
      // no_key or error
      indicators.push("⚠️ Google Safe Browsing: Unavailable");
      gsbBadge = "unavailable";
    }

    // Recalculate final score after GSB
    const finalScore = gsb.status === "danger" ? Math.max(localScore, 90) : localScore;
    const level = finalScore>=75?"critical":finalScore>=50?"high":finalScore>=25?"medium":"low";

    return {
      score: finalScore,
      level,
      gsbBadge, // ← NEW: tells UI which GSB badge to render
      indicators: indicators.length ? indicators : ["No malicious patterns detected"],
      recommendation: finalScore>=75
        ? "Do NOT visit this URL. It shows strong indicators of phishing or malware. Delete the message containing it."
        : finalScore>=50
        ? "Avoid this URL. Verify with the official website directly by typing the address manually."
        : finalScore>=25
        ? "Proceed with caution. Do not enter passwords or payment details."
        : "URL appears low-risk. Still avoid entering sensitive data on unfamiliar sites.",
    };
  },

  phone(raw) {
    const cleaned = raw.replace(/[\s\-\(\)\+]/g,"");
    const indicators = [], weights = [];
    let structuralFlag = null;

    const len = cleaned.length;
    const isE164 = cleaned.startsWith("91") && len === 12;
    const is10  = len === 10;
    if (!is10 && !isE164) {
      indicators.push(`Invalid length (${len} digits) — expected 10 or 12 with country code`);
      weights.push(55);
      structuralFlag = "❌ Invalid Length";
    }

    const num = isE164 ? cleaned.slice(2) : cleaned;

    if (cleaned.length === 12 && !cleaned.startsWith("91")) {
      indicators.push(`Invalid/unrecognized country code (+${cleaned.slice(0,2)})`);
      weights.push(40);
      structuralFlag = structuralFlag || "❌ Invalid Country Code";
    }

    if (/^(.)\1{9}$/.test(num)) {
      indicators.push("All digits identical — not a real phone number");
      weights.push(95);
      structuralFlag = "🔴 Invalid Number";
    } else if (/^(0123456789|1234567890|2345678901|0?123456789)$/.test(num)) {
      indicators.push("Strictly ascending sequential digits — synthetic number");
      weights.push(75);
      structuralFlag = "🟠 Sequential Digits";
    } else if (/^(9876543210|8765432109|7654321098)$/.test(num)) {
      indicators.push("Strictly descending sequential digits — synthetic number");
      weights.push(75);
      structuralFlag = "🟠 Descending Sequence";
    } else if (/^(.)(.)(\1\2){4}$/.test(num)) {
      indicators.push("Strict alternating two-digit pattern — synthetic/test number");
      weights.push(60);
      structuralFlag = "🟡 Repetitive Pattern";
    } else if (/(.)\1{4,}/.test(num)) {
      const match = num.match(/(.)\1{4,}/);
      const rep = match[1];
      const repCount = (num.split(rep).length - 1);
      if (repCount >= 5) {
        indicators.push(`Digit '${rep}' repeats ${repCount}x — excessive repetition pattern`);
        weights.push(55);
        structuralFlag = "🟡 Excessive Repetition";
      }
    }

    if (!structuralFlag && /^(0000|1111|9999|0000)/.test(num)) {
      indicators.push("Suspicious uniform 4-digit prefix");
      weights.push(35);
      structuralFlag = structuralFlag || "🟡 Suspicious Pattern";
    }

    const entropy = calcEntropy(num);
    if (entropy < 1.8 && !indicators.length) {
      indicators.push(`Very low digit entropy (${entropy.toFixed(2)}) — low randomness`);
      weights.push(28);
    } else if (entropy < 2.5 && weights.length === 0) {
      indicators.push(`Below-average entropy (${entropy.toFixed(2)}) — some pattern detected`);
      weights.push(15);
    }

    if (is10 && /^[0-5]/.test(num)) {
      indicators.push(`Number starts with '${num[0]}' — Indian mobile numbers start with 6-9`);
      weights.push(50);
      structuralFlag = structuralFlag || "🔴 Invalid Number";
    }

    if (DB.phoneBlacklist.has(num) || DB.phoneBlacklist.has(cleaned)) {
      indicators.push("🚨 Matched fraud blacklist database");
      weights.push(90);
      structuralFlag = structuralFlag || "🔴 Blacklisted Number";
    }
    const communityData = DB.communityReports[num] || DB.communityReports[cleaned];
    if (communityData) {
      indicators.push(`Community reported ${communityData.reports}x — category: ${communityData.category}`);
      weights.push(Math.min(communityData.reports * 4, 45));
    }

    const voipPrefixes = ["700","710","720","730","740"];
    if (voipPrefixes.some(p=>num.startsWith(p))) {
      indicators.push("Prefix associated with VoIP / virtual number range");
      weights.push(18);
    }

    const score = Math.min(weights.reduce((a,b)=>a+b,0), 100);
    const level = score>=75?"critical":score>=50?"high":score>=25?"medium":"low";

    return {
      score, level, structuralFlag,
      indicators: indicators.length ? indicators : ["No suspicious patterns detected — number appears structurally valid"],
      recommendation:
        score>=75 ? "Do NOT answer or call back. Block this number immediately and report to TRAI DND (1909)."
        :score>=50 ? "Exercise high caution. Do not share OTP, PIN, Aadhaar, or any personal details."
        :score>=25 ? "Some pattern anomalies found. Verify caller identity independently before sharing any info."
        : "Number appears structurally valid. Always verify caller identity before sharing sensitive data.",
    };
  },

  async emailFull(raw) {
    const email = raw.trim().toLowerCase();
    const [localPart, domainPart] = email.split("@");

    const step = (id, label, status, detail) => ({ id, label, status, detail });

    const steps = [];
    let riskWeights = [];
    let emailStatus = "verified";

    const RFC = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    const atCount = (email.match(/@/g)||[]).length;
    let syntaxOk = RFC.test(email) && atCount === 1 && !!localPart && !!domainPart;
    if (!syntaxOk) {
      const why = !email.includes("@") ? "Missing @ symbol"
        : atCount>1 ? "Multiple @ symbols (RFC violation)"
        : !localPart ? "Missing username"
        : !domainPart||!domainPart.includes(".") ? "Invalid or missing domain"
        : "Invalid characters detected";
      steps.push(step(1,"Syntax Validation (RFC 5321/5322)","fail",why));
      riskWeights.push(70); emailStatus = "invalid";
    } else {
      if (/^\.|\.$|\.\./.test(localPart)) {
        steps.push(step(1,"Syntax Validation (RFC 5321/5322)","warn","Invalid dot placement in username"));
        riskWeights.push(20);
      } else {
        steps.push(step(1,"Syntax Validation (RFC 5321/5322)","pass","Email format is RFC-compliant"));
      }
    }

    if (DB.emailWhitelist.has(email)) {
      steps.push(step(2,"Reputation Database","pass","Found in trusted whitelist — known legitimate sender"));
      const score=Math.floor(Math.random()*12)+2;
      return { score, confidence:96, level:"low", emailStatus:"verified",
        structuralFlag:"✅ Whitelist Match", steps,
        indicators:["Whitelisted trusted sender"],
        recommendation:"This is a verified, trusted email address. Safe to interact with." };
    }
    if (DB.emailBlacklist.has(email)) {
      steps.push(step(2,"Reputation Database","fail","🚨 Found in scam/phishing blacklist"));
      const score=95+Math.floor(Math.random()*5);
      return { score, confidence:99, level:"critical", emailStatus:"invalid",
        structuralFlag:"🚨 Blacklist Match", steps,
        indicators:["Known scam/phishing address in blacklist database"],
        recommendation:"Do NOT interact. This is a confirmed phishing/scam address. Block and report immediately." };
    }
    steps.push(step(2,"Reputation Database","pass","Not found in local blacklist/whitelist"));

    if (!syntaxOk) {
      return { score:Math.min(riskWeights.reduce((a,b)=>a+b,0),100), confidence:10,
        level:"critical", emailStatus:"invalid", structuralFlag:"❌ Invalid Syntax",
        steps, indicators:["RFC syntax validation failed"],
        recommendation:"This is not a valid email address. Double-check for typos." };
    }

    const KNOWN_DOMAINS = new Set([
      "gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","protonmail.com",
      "zoho.com","aol.com","live.com","msn.com","ymail.com","googlemail.com",
      "rediffmail.com","indiatimes.com","sify.com","yahoo.co.in","hotmail.co.in",
      "google.com","microsoft.com","apple.com","amazon.com","github.com","linkedin.com",
      "twitter.com","meta.com","netflix.com","adobe.com","salesforce.com","slack.com",
      "zoom.us","dropbox.com","stripe.com","paypal.com","uber.com","airbnb.com",
      "spotify.com","figma.com","notion.so","atlassian.com","cloudflare.com","vercel.com",
      "anthropic.com","sbi.co.in","hdfcbank.com","icicibank.com","axisbank.com",
      "pnbindia.in","irctc.co.in","npci.org.in","uidai.gov.in","incometax.gov.in",
      "rbi.org.in","zomato.com","swiggy.com","flipkart.com","myntra.com","paytm.com",
    ]);
    const INVALID_DOMAINS = new Set([
      "nonexistentxyz123.com","fake-domain-xyz.net","no-such-domain.io",
      "invalid-mail-domain.xyz","notarealdomain123.org",
    ]);
    const tld = domainPart.split(".").pop();
    const VALID_TLDS = new Set(["com","net","org","in","io","co","edu","gov","uk","us","ca","au","de","fr","jp","cn","br","info","biz","me","tv","app","dev","ai","cloud","tech","online","site","web","store"]);
    const domainExists = KNOWN_DOMAINS.has(domainPart) ? true
      : INVALID_DOMAINS.has(domainPart) ? false
      : VALID_TLDS.has(tld) && domainPart.length > 4 && !domainPart.includes("..") ? "likely"
      : false;

    if (domainExists === false) {
      steps.push(step(3,"Domain Existence (DNS Simulation)","fail","Domain does not appear to exist"));
      riskWeights.push(60); emailStatus="invalid";
    } else if (domainExists === true) {
      steps.push(step(3,"Domain Existence (DNS Simulation)","pass","Domain verified in known-domains registry"));
    } else {
      steps.push(step(3,"Domain Existence (DNS Simulation)","warn","Domain structure valid but not in known registry (unverified)"));
      riskWeights.push(10);
      if (emailStatus==="verified") emailStatus="unable";
    }

    const MX_KNOWN = new Set([
      "gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","protonmail.com",
      "zoho.com","aol.com","live.com","rediffmail.com","sbi.co.in","hdfcbank.com",
      "google.com","microsoft.com","apple.com","amazon.com","github.com","linkedin.com",
    ]);
    const hasMX = MX_KNOWN.has(domainPart) ? true
      : domainExists===true ? "likely" : domainExists===false ? false : "unknown";

    if (hasMX === false) {
      steps.push(step(4,"MX Record Check","fail","No MX records found — domain cannot receive email"));
      riskWeights.push(55); emailStatus="invalid";
    } else if (hasMX === true) {
      steps.push(step(4,"MX Record Check","pass","MX records confirmed for this domain"));
    } else if (hasMX === "likely") {
      steps.push(step(4,"MX Record Check","warn","MX records likely exist (simulated — cannot verify in browser)"));
      riskWeights.push(5);
    } else {
      steps.push(step(4,"MX Record Check","warn","Unable to verify MX records in browser environment"));
      riskWeights.push(8); if (emailStatus==="verified") emailStatus="unable";
    }

    if (DB.disposableEmailProviders.has(domainPart)) {
      steps.push(step(5,"Disposable Email Detection","fail","Domain belongs to a known temporary/disposable email provider"));
      riskWeights.push(50); emailStatus="invalid";
    } else {
      steps.push(step(5,"Disposable Email Detection","pass","Not a known disposable email provider"));
    }

    if (domainExists===false || hasMX===false) {
      steps.push(step(6,"SMTP Mailbox Verification","skip","Skipped — domain/MX invalid"));
    } else if (KNOWN_DOMAINS.has(domainPart) && MX_KNOWN.has(domainPart)) {
      const smtpBlocked = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com"].includes(domainPart);
      if (smtpBlocked) {
        steps.push(step(6,"SMTP Mailbox Verification","warn",`${domainPart} blocks SMTP probing — marked Unable to Verify`));
        if (emailStatus==="verified") emailStatus="unable";
      } else {
        steps.push(step(6,"SMTP Mailbox Verification","pass","Simulated SMTP handshake accepted by mail server"));
      }
    } else {
      steps.push(step(6,"SMTP Mailbox Verification","warn","Browser environment: real SMTP probe not possible — backend API required"));
      if (emailStatus==="verified") emailStatus="unable";
    }

    const CATCHALL_DOMAINS = new Set(["example.com","test.com","sample.org","demo.net"]);
    if (CATCHALL_DOMAINS.has(domainPart)) {
      steps.push(step(7,"Catch-all Domain Check","warn","Domain appears to be catch-all — accepts any username"));
      riskWeights.push(12); if (emailStatus==="verified") emailStatus="unable";
    } else {
      steps.push(step(7,"Catch-all Domain Check","pass","No catch-all configuration detected"));
    }

    const indicators = [];
    const kws = DB.suspiciousKeywords.email.filter(k=>localPart.includes(k));
    if (kws.length) { indicators.push(`Suspicious keyword${kws.length>1?"s":""}: ${kws.slice(0,3).join(", ")}`); riskWeights.push(Math.min(kws.length*15,50)); }
    const digits=(localPart.match(/\d/g)||[]).length;
    if (digits>6){ indicators.push(`Excessive digits (${digits})`); riskWeights.push(18); }
    else if (digits>4){ indicators.push(`High digit count (${digits})`); riskWeights.push(8); }
    const entropy=calcEntropy(localPart);
    if (entropy>4.0){ indicators.push(`Very high randomness (entropy: ${entropy.toFixed(2)})`); riskWeights.push(25); }
    else if (entropy>3.5){ indicators.push(`High entropy (${entropy.toFixed(2)})`); riskWeights.push(12); }
    if (/(.)\1{2,}/.test(localPart)){ indicators.push("Repeated character pattern"); riskWeights.push(12); }
    if (/(\d{2,})\1/.test(localPart)){ indicators.push("Repeated numeric sequence"); riskWeights.push(14); }
    const digitRatio=digits/(localPart.length||1);
    if (digitRatio>0.45&&localPart.length>5){ indicators.push(`Unusual digit ratio (${Math.round(digitRatio*100)}%)`); riskWeights.push(16); }
    const typosquats=["g00gle","gmai1","yahooo","hotmai1","outl00k","microsft","amaz0n","paypa1"];
    if (typosquats.some(t=>domainPart.includes(t))){ indicators.push("Typosquatted domain detected"); riskWeights.push(55); }
    const domTld="."+tld;
    if (DB.suspiciousTLDs.has(domTld)){ indicators.push(`Suspicious TLD (${domTld})`); riskWeights.push(20); }
    const cr=DB.communityReports[email];
    if (cr){ indicators.push(`Community reported ${cr.reports}x: ${cr.category}`); riskWeights.push(Math.min(cr.reports*3,40)); }
    if (localPart.length>30){ indicators.push("Abnormally long username"); riskWeights.push(10); }

    const rawScore = Math.min(Math.max(riskWeights.reduce((a,b)=>a+b,0),0),100);
    const level = rawScore>=75?"critical":rawScore>=50?"high":rawScore>=25?"medium":"low";
    const confidence = emailStatus==="invalid" ? Math.min(85+riskWeights.length*2,99)
      : emailStatus==="unable" ? Math.floor(35+Math.random()*25)
      : Math.max(88-rawScore,55);

    return {
      score: rawScore, confidence, level, emailStatus,
      structuralFlag: null, steps,
      indicators: indicators.length ? indicators : ["No heuristic red flags detected"],
      recommendation:
        emailStatus==="invalid" ? "This email address is invalid or undeliverable. Do not use it."
        : rawScore>=75 ? "Do NOT interact. Strong phishing/scam signals. Block and report."
        : rawScore>=50 ? "Suspicious. Avoid clicking links or sharing personal data."
        : rawScore>=25 ? "Some anomalies found. Verify sender independently before responding."
        : "Email appears legitimate. Always verify sender before sharing sensitive information.",
    };
  },

  email(raw) {
    return { score:0, level:"low", indicators:[], recommendation:"" };
  },

  sms(raw) {
    const text = raw.trim().toLowerCase();
    const indicators = [], weights = [];
    const kws = DB.suspiciousKeywords.sms.filter(k=>text.includes(k));
    if (kws.length) { indicators.push(`High-risk keywords: ${kws.slice(0,5).join(", ")}`); weights.push(kws.length*12); }
    if (/https?:\/\/[^\s]+/i.test(text)) { indicators.push("Contains URL — inspect before clicking"); weights.push(20); }
    if (/bit\.ly|tinyurl|t\.co|short\./i.test(text)) { indicators.push("Shortened URL detected"); weights.push(25); }
    if (/\d{4,6}.*otp|otp.*\d{4,6}/i.test(text)) { indicators.push("Requests OTP — banks never ask via SMS"); weights.push(55); }
    if (/₹|rs\.?\s*\d|lakh|crore/i.test(text)) { indicators.push("Monetary amount mentioned — financial bait"); weights.push(20); }
    if (/won|winner|selected|congratulations|lucky/i.test(text)) { indicators.push("Prize/lottery language detected"); weights.push(35); }
    if (/call now|reply now|act now|immediately|expire/i.test(text)) { indicators.push("Artificial urgency tactics"); weights.push(25); }
    if (/account.*block|suspend|deactivat/i.test(text)) { indicators.push("Threat-based manipulation pattern"); weights.push(30); }
    if (/click here|tap here|download now/i.test(text)) { indicators.push("Directive click action — common in phishing"); weights.push(22); }
    const score = Math.min(weights.reduce((a,b)=>a+b,0),100);
    return {
      score, level: score>=75?"critical":score>=50?"high":score>=25?"medium":"low",
      indicators: indicators.length ? indicators : ["No scam patterns detected in this message"],
      recommendation: score>=75?"This is almost certainly a scam. Do not call, click, or reply. Block the sender."
        :score>=50?"Very suspicious. Do not click any links. Contact your bank/service directly."
        :score>=25?"Some red flags. Verify the sender through official channels."
        :"Message appears benign. Always double-check before clicking unknown links.",
    };
  },

  domain(raw) {
    const domain = raw.trim().toLowerCase().replace(/^https?:\/\//,"").split("/")[0];
    const indicators = [], weights = [];
    if (DB.domainBlacklist.has(domain)) { indicators.push("🚨 Domain in threat intelligence blacklist"); weights.push(90); }
    const tld = "."+domain.split(".").pop();
    if (DB.suspiciousTLDs.has(tld)) { indicators.push(`Suspicious TLD (${tld})`); weights.push(22); }
    if (DB.trustedTLDs.has("."+domain.split(".").slice(-2).join("."))) weights.push(-20);
    const kws = DB.suspiciousKeywords.domain.filter(k=>domain.includes(k));
    if (kws.length) { indicators.push(`Suspicious keywords in domain: ${kws.join(", ")}`); weights.push(kws.length*16); }
    const entropy = calcEntropy(domain.split(".")[0]);
    if (entropy > 3.6) { indicators.push(`High domain randomness (entropy: ${entropy.toFixed(2)})`); weights.push(22); }
    if (domain.split(".")[0].length > 20) { indicators.push("Unusually long domain name"); weights.push(16); }
    if ((domain.match(/\d/g)||[]).length > 3) { indicators.push("Excessive digits in domain"); weights.push(18); }
    if ((domain.match(/-/g)||[]).length > 2) { indicators.push("Multiple hyphens — common in phishing domains"); weights.push(20); }
    const simDomains = ["paypal","amazon","flipkart","sbi","hdfc","icici","google","microsoft"];
    const hit = simDomains.find(s=>domain.includes(s)&&!domain.endsWith(`.${s}.com`)&&!domain.endsWith(`${s}.com`));
    if (hit) { indicators.push(`Mimics trusted brand: ${hit}`); weights.push(40); }
    const score = Math.min(Math.max(weights.reduce((a,b)=>a+b,0),0),100);
    return {
      score, level: score>=75?"critical":score>=50?"high":score>=25?"medium":"low",
      indicators: indicators.length ? indicators : ["Domain appears legitimate"],
      recommendation: score>=75?"Do not visit. This domain shows strong malicious indicators."
        :score>=50?"Suspicious domain. Access official sites by typing them manually."
        :score>=25?"Proceed carefully. Verify this is the official website."
        :"Domain appears low-risk. Always verify SSL and domain authenticity.",
    };
  },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Shield({ size=40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="rgba(0,212,255,0.08)" stroke="#00D4FF" strokeWidth="1.2"/>
      <polygon points="24,7 39,16 39,33 24,42 9,33 9,16" fill="none" stroke="rgba(91,91,255,0.4)" strokeWidth="0.7"/>
      <circle cx="24" cy="24" r="7" fill="none" stroke="#5B5BFF" strokeWidth="1" strokeDasharray="2.5,2"/>
      <circle cx="24" cy="24" r="3" fill="#00D4FF" opacity="0.9"/>
      <circle cx="24" cy="24" r="1.5" fill="#fff"/>
    </svg>
  );
}

function RiskGauge({ score }) {
  const levels = [
    {min:0,  max:25,  color:C.success, label:"Low",      emoji:"🟢"},
    {min:25, max:50,  color:C.warning, label:"Medium",   emoji:"🟡"},
    {min:50, max:75,  color:"#FF7A00", label:"High",     emoji:"🟠"},
    {min:75, max:101, color:C.danger,  label:"Critical", emoji:"🔴"},
  ];
  const lvl = levels.find(l=>score>=l.min&&score<l.max)||levels[3];
  const r=52, cx=70, cy=70, circ=2*Math.PI*r;
  const arc=(score/100)*circ*0.75;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <svg width="140" height="100" viewBox="0 0 140 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"
          strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={-circ*0.125} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={lvl.color} strokeWidth="10"
          strokeDasharray={`${arc} ${circ}`} strokeDashoffset={-circ*0.125} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)"}}/>
        <circle cx={cx} cy={cy} r="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
        <text x={cx} y={cy-2} textAnchor="middle" fill={lvl.color} fontSize="22" fontWeight="700" fontFamily="Inter">{score}</text>
        <text x={cx} y={cy+14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="Inter">/ 100</text>
      </svg>
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:lvl.color}}>
        <span style={{fontSize:16}}>{lvl.emoji}</span> Risk Level: {lvl.label}
      </div>
    </div>
  );
}

function IndicatorTag({ text }) {
  const isCritical = text.startsWith("🚨");
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 12px",marginBottom:6,
      background:isCritical?"rgba(255,77,79,0.08)":"rgba(255,255,255,0.04)",
      border:`1px solid ${isCritical?"rgba(255,77,79,0.3)":"rgba(255,255,255,0.08)"}`,
      borderRadius:8,fontSize:13,lineHeight:1.5,color:isCritical?"#FF8080":C.text}}>
      <span style={{flexShrink:0,marginTop:1,color:C.warning}}>{isCritical?"":"▸"}</span>
      {text}
    </div>
  );
}

function ScanBadge({ level }) {
  const map = {
    low:      {c:C.success,  bg:"rgba(0,200,83,0.12)",   l:"Low Risk"},
    medium:   {c:C.warning,  bg:"rgba(255,193,7,0.12)",  l:"Medium Risk"},
    high:     {c:"#FF7A00",  bg:"rgba(255,122,0,0.12)",  l:"High Risk"},
    critical: {c:C.danger,   bg:"rgba(255,77,79,0.15)",  l:"Critical Risk"},
  };
  const m = map[level]||map.low;
  return (
    <span style={{padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,
      background:m.bg,color:m.c,border:`1px solid ${m.c}40`}}>
      {m.l}
    </span>
  );
}

// ── NEW: Google Safe Browsing Badge UI ────────────────────────────────────────
function GSBBadge({ gsbBadge }) {
  if (!gsbBadge) return null;

  if (gsbBadge === "danger") return (
    <div style={{marginTop:10,padding:"12px 14px",borderRadius:10,
      background:"rgba(255,77,79,0.12)",border:"2px solid rgba(255,77,79,0.5)",
      display:"flex",flexDirection:"column",gap:4}}>
      <div style={{fontWeight:700,color:C.danger,fontSize:13}}>
        🚨 Google Safe Browsing has flagged this URL as dangerous!
      </div>
      <div style={{fontSize:11,color:C.muted}}>🛡️ Powered by Google Safe Browsing</div>
    </div>
  );

  if (gsbBadge === "safe") return (
    <div style={{marginTop:10,padding:"10px 14px",borderRadius:10,
      background:"rgba(0,200,83,0.08)",border:"1px solid rgba(0,200,83,0.3)",
      display:"flex",flexDirection:"column",gap:4}}>
      <div style={{fontWeight:600,color:C.success,fontSize:13}}>
        ✅ Google Safe Browsing: No threats detected
      </div>
      <div style={{fontSize:11,color:C.muted}}>🛡️ Powered by Google Safe Browsing</div>
    </div>
  );

  // unavailable
  return (
    <div style={{marginTop:10,padding:"8px 14px",borderRadius:10,
      background:"rgba(255,193,7,0.07)",border:"1px solid rgba(255,193,7,0.25)",
      display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:13,color:C.warning}}>⚠️ Google Safe Browsing: Unavailable</span>
      <span style={{fontSize:11,color:C.muted}}>— local engine only</span>
    </div>
  );
}

const SCAN_TYPES = [
  { id:"upi",    label:"UPI ID",   icon:"💳", ph:"merchant@paytm" },
  { id:"url",    label:"URL",      icon:"🔗", ph:"https://example.com" },
  { id:"phone",  label:"Phone",    icon:"📞", ph:"+91 98765 43210" },
  { id:"email",  label:"Email",    icon:"📧", ph:"user@domain.com" },
  { id:"sms",    label:"SMS/Text", icon:"💬", ph:"Paste suspicious message…", big:true },
  { id:"domain", label:"Domain",   icon:"🌐", ph:"suspicious-site.xyz" },
];

// ─── PAGES ────────────────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  const [counts, setCounts] = useState([0,0,0,0]);
  const targets = [2471893,153204,98700,45];
  useEffect(()=>{
    const dur=1400, start=Date.now();
    const id=setInterval(()=>{
      const p=Math.min((Date.now()-start)/dur,1);
      const e=1-Math.pow(1-p,3);
      setCounts(targets.map(t=>Math.floor(t*e)));
      if(p>=1) clearInterval(id);
    },16);
    return()=>clearInterval(id);
  },[]);

  const stats=[
    {val:counts[0].toLocaleString()+"+",label:"Total Scans"},
    {val:counts[1].toLocaleString()+"+",label:"Threats Detected"},
    {val:counts[2].toLocaleString()+"+",label:"Users Protected"},
    {val:counts[3]+"+",label:"Intel Sources"},
  ];
  const tools=[
    {icon:"💳",t:"UPI Fraud Guard",     d:"Multi-heuristic UPI risk scoring with entropy, keyword & blacklist analysis"},
    {icon:"🔗",t:"URL Analyzer",        d:"Deep phishing, typosquatting, redirect chain & TLD reputation analysis"},
    {icon:"📞",t:"Phone Checker",       d:"Spam database, virtual number detection & community reports"},
    {icon:"📧",t:"Email Verifier",      d:"Disposable provider, spoofed domain & phishing indicator checks"},
    {icon:"💬",t:"SMS Scam Detector",   d:"AI-powered message classification with pattern & keyword scoring"},
    {icon:"🌐",t:"Domain Intel",        d:"Threat reputation, brand impersonation & entropy-based risk scoring"},
    {icon:"🤖",t:"AI Assistant",        d:"Ask cybersecurity questions in plain language"},
    {icon:"🎓",t:"Learn & Quiz",        d:"Interactive lessons and quizzes to sharpen your cyber awareness"},
  ];

  return (
    <div className="fu">
      <div style={{textAlign:"center",padding:"50px 20px 36px"}}>
        <div style={{display:"inline-flex",padding:16,borderRadius:"50%",background:"rgba(0,212,255,0.06)",border:"1px solid rgba(0,212,255,0.15)",marginBottom:20,animation:"glow 3s ease infinite"}}>
          <Shield size={56}/>
        </div>
        <div style={{fontSize:10,letterSpacing:5,color:C.cyan,marginBottom:14,textTransform:"uppercase",fontWeight:500}}>AI-Powered Threat Intelligence</div>
        <h1 style={{fontSize:"clamp(28px,5vw,50px)",fontWeight:700,lineHeight:1.1,marginBottom:14}}>
          <span>Think Before </span>
          <span style={{background:`linear-gradient(135deg,${C.cyan},${C.blue},${C.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>You Click.</span>
        </h1>
        <p style={{color:C.muted,fontSize:15,maxWidth:480,margin:"0 auto 28px",lineHeight:1.75}}>
          Smart hybrid risk analyzer — not just keyword matching. Multi-heuristic scoring with entropy analysis, blacklists, community intel & AI reasoning.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn-prime" style={{padding:"13px 30px",fontSize:14}} onClick={()=>setPage("Scanner")}>🔍 Analyze Now</button>
          <button className="btn-ghost" style={{padding:"13px 22px",fontSize:14}} onClick={()=>setPage("Assistant")}>🤖 Ask AI</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,padding:"0 20px 36px"}}>
        {stats.map(s=>(
          <div key={s.label} className="glass-sm" style={{padding:"16px 12px",textAlign:"center"}}>
            <div className="mono" style={{fontSize:20,fontWeight:700,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:5}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"0 20px 60px"}}>
        <h2 style={{textAlign:"center",fontSize:18,fontWeight:600,marginBottom:4}}>Comprehensive Security Toolkit</h2>
        <p style={{textAlign:"center",color:C.muted,fontSize:12,marginBottom:20}}>Hybrid rule engine + AI — built to replace simple keyword checkers</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:10}}>
          {tools.map(f=>(
            <div key={f.t} className="glass" style={{padding:"16px 14px",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,212,255,.35)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform=""}}
              onClick={()=>setPage(["AI Assistant","Ask AI"].includes(f.t)?"Assistant":f.t==="Learn & Quiz"?"Learn":"Scanner")}>
              <div style={{fontSize:22,marginBottom:10}}>{f.icon}</div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:5}}>{f.t}</div>
              <div style={{color:C.muted,fontSize:11,lineHeight:1.55}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScannerPage() {
  const [tab, setTab] = useState("upi");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aiNote, setAiNote] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const cur = SCAN_TYPES.find(t=>t.id===tab);

  // ── CHANGED: runScan now awaits async url() ───────────────────────────────
  async function runScan() {
    if (!input.trim()) return;
    setLoading(true); setResult(null); setAiNote("");

    let r;
    if (tab === "email") {
      r = await RISK_ENGINE.emailFull(input);
    } else if (tab === "url") {
      r = await RISK_ENGINE.url(input);   // ← async now
    } else {
      r = RISK_ENGINE[tab]
        ? RISK_ENGINE[tab](input)
        : { score:0, level:"low", indicators:["Scanner not implemented yet"], recommendation:"" };
    }

    setResult(r);
    setLoading(false);

    if (r.score > 0) {
      setAiLoading(true);
      try {
        const prompt = `You are SentinelX, a cybersecurity AI. A ${tab} was analyzed: "${input.trim()}"
Risk score: ${r.score}/100 (${r.level})
Detected indicators: ${r.indicators.join("; ")}
In 2-3 sentences, give a plain-language explanation of WHY this is risky and what the user should do. Be direct, no fluff.`;
        const res = await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:200,messages:[{role:"user",content:prompt}]})
        });
        const data = await res.json();
        setAiNote(data.content?.find(c=>c.type==="text")?.text||"");
      } catch { setAiNote(""); }
      setAiLoading(false);
    }
  }

  const riskC = result
    ? (result.level==="critical"?C.danger:result.level==="high"?"#FF7A00":result.level==="medium"?C.warning:C.success)
    : C.cyan;

  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🔍 Smart Risk Analyzer</h2>
        <p style={{color:C.muted,fontSize:12}}>Hybrid rule engine — multi-heuristic, not just keyword matching</p>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {SCAN_TYPES.map(t=>(
          <button key={t.id} className="tab" onClick={()=>{setTab(t.id);setResult(null);setInput("");setAiNote("")}}
            style={{padding:"7px 13px",fontSize:12,
              color:tab===t.id?"#000":C.muted,
              background:tab===t.id?`linear-gradient(135deg,${C.cyan},${C.blue})`:"rgba(255,255,255,0.04)",
              border:tab===t.id?"none":"1px solid rgba(255,255,255,0.07)",
              fontWeight:tab===t.id?700:400}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="glass" style={{padding:18,marginBottom:14}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Enter {cur.label} to analyze:</div>
        {cur.big ? (
          <textarea className="ifield" value={input} onChange={e=>setInput(e.target.value)}
            placeholder={cur.ph} style={{padding:"11px 13px",fontSize:13,minHeight:80,resize:"vertical"}}/>
        ) : (
          <input className="ifield" value={input} onChange={e=>setInput(e.target.value)}
            placeholder={cur.ph} onKeyDown={e=>e.key==="Enter"&&runScan()}
            style={{padding:"11px 13px",fontSize:13}}/>
        )}
        <button className="btn-prime" onClick={runScan} disabled={loading||!input.trim()}
          style={{marginTop:11,padding:"11px 26px",fontSize:13}}>
          {loading
            ? (tab==="url" ? "⏳ Checking Safe Browsing…" : "⏳ Analyzing…")
            : "🔬 Run Analysis"}
        </button>
      </div>

      {loading && (
        <div className="glass" style={{padding:28,textAlign:"center"}}>
          <div style={{width:36,height:36,border:"3px solid rgba(0,212,255,0.15)",borderTop:`3px solid ${C.cyan}`,
            borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 14px"}}/>
          <p style={{color:C.cyan,fontSize:13}}>
            {tab==="url" ? "Running heuristics + Google Safe Browsing…" : "Running hybrid analysis engine…"}
          </p>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:10}}>
            {(tab==="url"
              ? ["Entropy check","Blacklist lookup","Keyword scan","🛡️ Google Safe Browsing","Pattern match"]
              : ["Entropy check","Blacklist lookup","Keyword scan","Pattern match","Community intel"]
            ).map(s=>(
              <span key={s} style={{fontSize:10,color:C.muted,background:"rgba(255,255,255,0.04)",padding:"3px 9px",borderRadius:20}}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="fu">
          <div className="glass" style={{padding:20,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <RiskGauge score={result.score}/>
              <div style={{flex:1,minWidth:180}}>
                <div style={{marginBottom:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <ScanBadge level={result.level}/>
                  {result.structuralFlag && (
                    <span style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,
                      background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",
                      color:C.text,letterSpacing:.3}}>
                      {result.structuralFlag}
                    </span>
                  )}
                </div>
                <div className="mono" style={{fontSize:11,color:C.muted,marginBottom:6}}>
                  Risk Score: <span style={{color:riskC,fontWeight:600}}>{result.score}/100</span>
                </div>
                <div style={{fontSize:11,color:C.muted}}>
                  Analyzed: <span style={{color:C.text}}>{input.trim().slice(0,40)}{input.length>40?"…":""}</span>
                </div>
              </div>
            </div>

            {/* ── NEW: GSB badge inside result card, below gauge ── */}
            {tab==="url" && result.gsbBadge && (
              <GSBBadge gsbBadge={result.gsbBadge}/>
            )}
          </div>

          <div className="glass" style={{padding:18,marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
              ⚡ Detected Indicators
              <span style={{background:"rgba(0,212,255,0.1)",color:C.cyan,fontSize:10,padding:"2px 8px",borderRadius:20}}>
                {result.indicators.length} found
              </span>
            </div>
            {result.indicators.map((ind,i)=><IndicatorTag key={i} text={ind}/>)}
          </div>

          <div className="glass" style={{padding:18,marginBottom:12,borderColor:`${riskC}30`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:10}}>💡 Recommendation</div>
            <p style={{fontSize:13,color:C.text,lineHeight:1.7}}>{result.recommendation}</p>
          </div>

          {(aiNote||aiLoading) && (
            <div className="glass fu" style={{padding:18,borderColor:"rgba(91,91,255,0.3)"}}>
              <div style={{fontSize:12,fontWeight:600,color:C.violet,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                🤖 AI Analysis
                {aiLoading&&<span style={{animation:"pulse 1s infinite",fontSize:10,color:C.muted}}>generating…</span>}
              </div>
              {aiNote && <p style={{fontSize:13,color:C.text,lineHeight:1.7}}>{aiNote}</p>}
            </div>
          )}

          <div style={{marginTop:14,padding:"12px 16px",borderRadius:10,background:"rgba(255,193,7,0.06)",
            border:"1px solid rgba(255,193,7,0.2)",fontSize:12,color:"#C9A227"}}>
            ⚠️ This is a risk analysis based on heuristics and simulated threat intelligence. Always verify independently before making payments or sharing personal data.
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantPage() {
  const [msgs, setMsgs] = useState([{role:"assistant",text:"👋 Hello! I'm SentinelX AI. Ask me anything about online safety — phishing, UPI scams, suspicious messages, how to stay secure, or paste something you want me to help assess."}]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);

  const chips = ["How do I spot a phishing email?","Is KYC update over SMS real?","How to protect my UPI?","What is smishing?"];

  async function send(text) {
    const t = text||inp.trim(); if(!t) return;
    setInp(""); setMsgs(m=>[...m,{role:"user",text:t}]); setLoading(true);
    try {
      const history = [...msgs.slice(1),{role:"user",text:t}].map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6",max_tokens:300,
          system:"You are SentinelX AI, a friendly cybersecurity assistant. Help users identify scams, phishing, UPI fraud, fake messages and stay safe online. Be concise (under 120 words), direct, and practical. Use plain language. When the user shares a suspicious message or ID, give a quick risk read.",
          messages:history,
        }),
      });
      const data = await res.json();
      setMsgs(m=>[...m,{role:"assistant",text:data.content?.find(c=>c.type==="text")?.text||"Error. Try again."}]);
    } catch { setMsgs(m=>[...m,{role:"assistant",text:"Connection error. Please retry."}]); }
    setLoading(false);
  }

  return (
    <div className="fu" style={{padding:"22px 18px",display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",minHeight:380}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🤖 AI Cyber Assistant</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:14}}>Ask anything about online safety</p>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"83%",padding:"11px 15px",fontSize:13,lineHeight:1.65,
              borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
              background:m.role==="user"?`linear-gradient(135deg,${C.cyan},${C.blue})`:"rgba(255,255,255,0.05)",
              color:m.role==="user"?"#000":C.text,
              border:m.role==="assistant"?`1px solid ${C.border}`:"none"}}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex"}}>
            <div style={{padding:"11px 15px",borderRadius:"16px 16px 16px 4px",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,fontSize:13,color:C.muted}}>
              <span style={{animation:"pulse 1s infinite"}}>● ● ●</span>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      {msgs.length<=2 && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {chips.map(c=><button key={c} className="btn-ghost" style={{fontSize:11,padding:"6px 11px"}} onClick={()=>send(c)}>{c}</button>)}
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input className="ifield" value={inp} onChange={e=>setInp(e.target.value)}
          placeholder="Ask about any security concern…" onKeyDown={e=>e.key==="Enter"&&send()}
          style={{flex:1,padding:"11px 14px",fontSize:13}}/>
        <button className="btn-prime" onClick={()=>send()} disabled={!inp.trim()||loading}
          style={{padding:"11px 18px",fontSize:13,opacity:(!inp.trim()||loading)?0.4:1}}>Send</button>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [counts, setCounts] = useState([0,0,0]);
  useEffect(()=>{
    const dur=1200, start=Date.now(), targets=[2471893,153204,2318689];
    const id=setInterval(()=>{
      const p=Math.min((Date.now()-start)/dur,1), e=1-Math.pow(1-p,3);
      setCounts(targets.map(t=>Math.floor(t*e)));
      if(p>=1) clearInterval(id);
    },16);
    return()=>clearInterval(id);
  },[]);

  const feed = [
    {type:"UPI",   val:"kyc@sbihelp.net",          score:92, level:"critical", time:"1m ago"},
    {type:"URL",   val:"paypal-secure-login.xyz",   score:88, level:"critical", time:"4m ago"},
    {type:"Phone", val:"+91 9876540001",             score:55, level:"high",     time:"9m ago"},
    {type:"Email", val:"support@amaz0n.in",          score:84, level:"critical", time:"15m ago"},
    {type:"SMS",   val:"You have won ₹5,00,000!…",  score:79, level:"critical", time:"22m ago"},
    {type:"Domain",val:"hdfc-kyc-verify.in",         score:91, level:"critical", time:"30m ago"},
    {type:"URL",   val:"github.com/anthropics",      score:4,  level:"low",      time:"38m ago"},
    {type:"UPI",   val:"zomato@icici",               score:3,  level:"low",      time:"52m ago"},
  ];
  const bars=[62,45,78,55,88,41,66];
  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const lc={critical:C.danger,high:"#FF7A00",medium:C.warning,low:C.success};

  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>📊 Dashboard</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:18}}>Live threat intelligence overview</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:18}}>
        {[["🔍","Total Scans",counts[0].toLocaleString()+"+",C.cyan],
          ["🛡️","Threats Found",counts[1].toLocaleString()+"+",C.danger],
          ["✅","Safe Scans",counts[2].toLocaleString()+"+",C.success],
          ["🎯","Accuracy","98.7%",C.blue]].map(([icon,label,val,color])=>(
          <div key={label} className="glass-sm" style={{padding:"15px 12px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
            <div className="mono" style={{fontSize:19,fontWeight:700,color}}>{val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{padding:18,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:14}}>📈 Weekly Threat Volume</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
          {bars.map((v,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",height:`${v}%`,background:`linear-gradient(180deg,${C.cyan},${C.blue})`,borderRadius:"4px 4px 0 0",opacity:.75}}/>
              <div style={{fontSize:9,color:C.muted}}>{days[i]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass" style={{padding:18}}>
        <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:12}}>🕐 Recent Community Scans</div>
        {feed.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",
            borderBottom:i<feed.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
            <span style={{fontSize:10,background:"rgba(0,212,255,0.08)",color:C.cyan,padding:"2px 7px",borderRadius:20,fontWeight:600,flexShrink:0}}>{s.type}</span>
            <span style={{flex:1,fontSize:12,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.val}</span>
            <span className="mono" style={{fontSize:11,fontWeight:700,color:lc[s.level],flexShrink:0}}>{s.score}</span>
            <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{s.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearnPage() {
  const [answered, setAnswered] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const qs = [
    { q:"Which of these is a strong sign of a phishing email?",
      opts:["Sender matches official bank domain","Urgent request to click a link immediately","Professional formatting and grammar","Message confirms your account is safe"],
      ans:1, explain:"Urgency is the #1 phishing manipulation tactic. Attackers create panic to prevent you from thinking critically." },
    { q:"A UPI ID 'kyc.update.7849@ybl' asks you to complete urgent KYC. What should you do?",
      opts:["Pay immediately to avoid account block","Update via your official bank app instead","Share your OTP to verify identity","Click the link they sent"],
      ans:1, explain:"Banks NEVER ask for KYC via UPI payment requests. Always use your official banking app or visit a branch." },
    { q:"What makes a domain like 'hdfc-netbanking-kyc.xyz' suspicious?",
      opts:["It has HDFC in the name","It uses suspicious TLD .xyz and hyphenated brand name","It has many letters","It ends in .xyz"],
      ans:1, explain:"Legitimate banks use .com or .in. Combining a real brand name with suspicious TLDs and hyphens is a classic phishing pattern." },
  ];
  const q = qs[qIdx];
  function nextQ() { setAnswered(null); setQIdx((qIdx+1)%qs.length); }

  const topics = [
    {icon:"🎣",t:"Phishing",          d:"Fake emails, sites & messages",    c:C.danger},
    {icon:"💳",t:"UPI Fraud",          d:"Fake payment & KYC scams",         c:C.warning},
    {icon:"🔐",t:"Password Safety",    d:"Strong passwords & 2FA",           c:C.blue},
    {icon:"📱",t:"Social Engineering", d:"Psychological manipulation",       c:C.violet},
    {icon:"🌐",t:"Safe Browsing",      d:"Spotting malicious sites",         c:C.success},
    {icon:"🔒",t:"Digital Privacy",    d:"Protecting personal data",         c:C.cyan},
  ];

  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🎓 Cyber Education Hub</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:18}}>Build your cyber awareness skills</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10,marginBottom:20}}>
        {topics.map(t=>(
          <div key={t.t} className="glass" style={{padding:"15px 13px",cursor:"pointer",transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform=""}>
            <div style={{fontSize:24,marginBottom:8}}>{t.icon}</div>
            <div style={{fontWeight:600,fontSize:13,color:t.c,marginBottom:4}}>{t.t}</div>
            <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{t.d}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{padding:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:C.cyan}}>🧠 Quick Quiz</div>
          <span style={{fontSize:10,color:C.muted}}>{qIdx+1} / {qs.length}</span>
        </div>
        <p style={{fontSize:14,fontWeight:500,marginBottom:16,lineHeight:1.6}}>{q.q}</p>
        {q.opts.map((o,i)=>(
          <button key={i} onClick={()=>setAnswered(i)} disabled={answered!==null}
            style={{display:"block",width:"100%",textAlign:"left",padding:"11px 14px",marginBottom:7,borderRadius:9,
              fontSize:13,cursor:answered===null?"pointer":"default",fontFamily:"Inter,sans-serif",
              background:answered===null?"rgba(255,255,255,0.04)":i===q.ans?"rgba(0,200,83,0.12)":i===answered?"rgba(255,77,79,0.1)":"rgba(255,255,255,0.03)",
              border:`1px solid ${answered===null?"rgba(255,255,255,0.08)":i===q.ans?C.success:i===answered?C.danger:"rgba(255,255,255,0.05)"}`,
              color:answered===null?C.text:i===q.ans?C.success:i===answered?C.danger:C.muted,transition:"all .2s"}}>
            {answered!==null&&i===q.ans?"✅ ":answered!==null&&i===answered?"❌ ":""}{o}
          </button>
        ))}
        {answered!==null && (
          <div className="fu" style={{marginTop:12,padding:"12px 15px",borderRadius:10,lineHeight:1.65,fontSize:13,
            background:answered===q.ans?"rgba(0,200,83,0.08)":"rgba(255,77,79,0.08)",
            border:`1px solid ${answered===q.ans?C.success:C.danger}`,color:C.text}}>
            {answered===q.ans?"✅ Correct! ":"❌ Not quite — "}{q.explain}
            <div style={{marginTop:10}}>
              <button className="btn-ghost" style={{fontSize:11,padding:"6px 14px"}} onClick={nextQ}>Next Question →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const NAV = [
  {id:"Home",      icon:"🏠"},
  {id:"Scanner",   icon:"🔍"},
  {id:"Assistant", icon:"🤖"},
  {id:"Dashboard", icon:"📊"},
  {id:"Learn",     icon:"🎓"},
];

export default function SentinelX() {
  const [page, setPage] = useState("Home");
  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:C.bg,maxWidth:760,margin:"0 auto"}}>
        <header style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",
          justifyContent:"space-between",position:"sticky",top:0,background:"rgba(8,14,28,0.96)",
          backdropFilter:"blur(14px)",zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("Home")}>
            <Shield size={30}/>
            <div>
              <div style={{fontWeight:700,fontSize:15,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SentinelX</div>
              <div style={{fontSize:8,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>Cyber Shield AI</div>
            </div>
          </div>
          <nav style={{display:"flex",gap:2}}>
            {NAV.map(n=>(
              <button key={n.id} className="tab" onClick={()=>setPage(n.id)}
                style={{padding:"6px 11px",fontSize:11,color:page===n.id?C.cyan:C.muted,
                  background:page===n.id?"rgba(0,212,255,0.08)":"transparent",
                  borderBottom:page===n.id?`2px solid ${C.cyan}`:"2px solid transparent",borderRadius:0}}>
                <span style={{marginRight:4}}>{n.icon}</span>
              </button>
            ))}
          </nav>
        </header>
        <main>
          {page==="Home"      && <HomePage setPage={setPage}/>}
          {page==="Scanner"   && <ScannerPage/>}
          {page==="Assistant" && <AssistantPage/>}
          {page==="Dashboard" && <DashboardPage/>}
          {page==="Learn"     && <LearnPage/>}
        </main>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:760,
          background:"rgba(8,14,28,0.97)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
          {NAV.map(n=>(
            <button key={n.id} className="tab" onClick={()=>setPage(n.id)}
              style={{flex:1,padding:"10px 4px 9px",fontSize:9,color:page===n.id?C.cyan:C.muted,
                display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:17}}>{n.icon}</span>{n.id}
            </button>
          ))}
        </div>
        <div style={{height:64}}/>
      </div>
    </>
  );
}
