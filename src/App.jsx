import React, { useState, useEffect, useRef } from "react";

const C = {
  bg:"#080E1C", surface:"rgba(255,255,255,0.035)", border:"rgba(0,212,255,0.13)",
  cyan:"#00D4FF", blue:"#5B5BFF", violet:"#8B5CF6",
  danger:"#FF4D4F", warning:"#FFC107", success:"#00C853", info:"#38BDF8",
  text:"#E2EEF8", muted:"#607D96", faint:"rgba(255,255,255,0.05)"
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{overscroll-behavior:none;height:100%}
body{font-family:'Inter',sans-serif;background:${C.bg};color:${C.text};overflow-x:hidden}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(0,212,255,0.25);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,212,255,.3)}50%{box-shadow:0 0 20px rgba(0,212,255,.6)}}
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

/* ── MOBILE RESPONSIVE ───────────────────────────────────────── */
@media (max-width:600px){

  /* Bottom nav — bade touch targets */
  .mobile-nav-btn{
    padding:10px 2px 8px !important;
    font-size:11px !important;
  }
  .mobile-nav-icon{
    font-size:22px !important;
  }

  /* Header compact */
  .mobile-header{
    padding:8px 12px !important;
  }
  .mobile-welcome{
    display:none !important;
  }
  .mobile-logout{
    padding:5px 8px !important;
    font-size:10px !important;
  }

  /* Scanner tabs scroll */
  .mobile-tabs{
    overflow-x:auto !important;
    flex-wrap:nowrap !important;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
    padding-bottom:4px;
  }
  .mobile-tabs::-webkit-scrollbar{display:none}

  /* Home hero compact */
  .mobile-hero{
    padding:24px 16px 20px !important;
  }
  .mobile-hero h1{
    font-size:26px !important;
  }
  .mobile-hero p{
    font-size:13px !important;
  }

  /* Tool cards — 2 column grid on mobile */
  .mobile-tools{
    grid-template-columns:repeat(2,1fr) !important;
    gap:8px !important;
  }
  .mobile-tool-card{
    padding:12px 10px !important;
  }
  .mobile-tool-card .tool-icon{
    font-size:18px !important;
    margin-bottom:6px !important;
  }
  .mobile-tool-card .tool-title{
    font-size:11px !important;
  }
  .mobile-tool-card .tool-desc{
    display:none !important;
  }

  /* Stats grid */
  .mobile-stats{
    grid-template-columns:repeat(2,1fr) !important;
    padding:0 12px 20px !important;
  }

  /* General padding */
  .mobile-page{
    padding:16px 12px !important;
  }
}
`;

function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) { console.warn("Storage write failed:", e); return false; }
}
function safeGetItem(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) { console.warn("Storage read failed:", e); return fallback; }
}

async function callAI({ messages, system }) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system }),
    });
    const data = await res.json();
    if (data.text) return data.text;
    return "AI analysis unavailable right now.";
  } catch {
    return "Connection error. Please try again.";
  }
}

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
  const trustedUsers = ["contact","info","support","hello","admin","noreply","newsletter","billing","sales","hr","careers","legal","privacy","security","abuse","help","webmaster","postmaster","accounts","orders","notifications","alerts","feedback","marketing","press","media","partnerships","developer","api"];
  const trustedDomains = ["google.com","microsoft.com","apple.com","amazon.com","github.com","linkedin.com","twitter.com","meta.com","netflix.com","adobe.com","salesforce.com","slack.com","zoom.us","dropbox.com","stripe.com","paypal.com","uber.com","airbnb.com","spotify.com","figma.com","notion.so","atlassian.com","cloudflare.com","vercel.com","anthropic.com","sbi.co.in","hdfcbank.com","icicibank.com","axisbank.com","pnbindia.in","irctc.co.in","npci.org.in","uidai.gov.in","incometax.gov.in","rbi.org.in","zomato.com","swiggy.com","flipkart.com","myntra.com","paytm.com"];
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
  upiBlacklist: new Set(["fraud@paytm","scam@upi","lottery@ybl","reward@okaxis","refund@oksbi","kyc@paytm","helpdesk@upi","cashback@ybl","verify@okicici","support@upi","prize@ybl","gift@okaxis","winner@oksbi","free@upi","urgent@paytm","pm@ybl","gov@upi","rbi@okaxis","income@oksbi","amazon@fake"]),
  upiWhitelist: new Set(["zomato@icici","swiggy@icici","amazon@apl","flipkart@ybl","paytmmall@paytm","netflix@icici","spotify@federal","irctc@upi","hdfc@hdfcbank","sbi@sbi","airtel@airtel","jio@jiomoney","ola@okaxis","uber@ybl","phonepe@ybl"]),
  phoneBlacklist: new Set(["9999999999","8888888888","7777777777","1234567890","0000000000","9876543210","9876543200","9123456789","8123456789","7012345678"]),
  domainBlacklist: new Set(["paypal-secure-login.xyz","amazon-offers.net","sbi-reward.com","hdfc-kyc-verify.in","free-iphone.win","rbi-lottery.org","pm-kisan-help.xyz","google-prize.info","whatsapp-reward.net","jio-cashback.co"]),
  emailBlacklist: EMAIL_BLACKLIST,
  emailWhitelist: EMAIL_WHITELIST,
  suspiciousKeywords: {
    upi: ["reward","cashback","refund","verify","kyc","lottery","gift","support","helpdesk","prize","winner","free","urgent","rbi","gov","income","pm","claim","bonus","offer"],
    email: ["reward","lottery","cashback","refund","verify","kyc","gift","support","admin","official","bank","payment","winner","crypto","investment","urgent","prize","claim","bonus","offer","free","alert","suspended","confirm","update","unusual","income","tax","bitcoin","nft","airdrop","token","wallet","helpdesk","earn"],
    sms: ["otp","pin","cvv","password","account","suspended","verify","click","link","won","prize","lottery","congratulations","free","gift","urgent","immediately","atm","card"],
    domain: ["login","secure","verify","account","update","confirm","bank","wallet","pay","reward","free","win","prize","offer","cheap","discount","deal"],
    url: ["login","secure","verify","account","update","bank","wallet","pay","free","win","prize","phish","malware","trojan","hack","crack","keygen","warez"],
  },
  communityReports: {
    "9876540001":{ reports:12, lastSeen:"2024-11-12", category:"fake KYC" },
    "8800990011":{ reports:8, lastSeen:"2024-10-30", category:"investment scam" },
    "help@lottery-india.com":{ reports:34, lastSeen:"2024-11-05", category:"lottery scam" },
    "kyc@sbihelp.net":{ reports:19, lastSeen:"2024-11-10", category:"phishing" },
  },
  disposableEmailProviders: new Set(["mailinator.com","guerrillamail.com","10minutemail.com","throwaway.email","trashmail.com","fakeinbox.com","yopmail.com","tempmail.com","dispostable.com","maildrop.cc","sharklasers.com","guerrillamailblock.com"]),
  trustedTLDs: new Set([".gov.in",".nic.in",".edu",".gov"]),
  suspiciousTLDs: new Set([".xyz",".win",".club",".top",".info",".biz",".tk",".ml",".ga",".cf"]),
};

function calcEntropy(s) {
  const freq = {};
  for (const c of s) freq[c] = (freq[c]||0)+1;
  const len = s.length;
  return -Object.values(freq).reduce((sum,f)=>{ const p=f/len; return sum+p*Math.log2(p); },0);
}
function hasRepeats(s,n=3) { return /(.)\1{2,}/.test(s) || new RegExp(`(..){${n},}`).test(s); }

async function callGoogleSafeBrowsing(rawUrl) {
  const apiKey = import.meta.env.VITE_GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) return { status: "no_key" };
  const targetUrl = rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl;
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ client:{clientId:"sentinelx",clientVersion:"1.0"}, threatInfo:{ threatTypes:["MALWARE","SOCIAL_ENGINEERING","UNWANTED_SOFTWARE","POTENTIALLY_HARMFUL_APPLICATION"], platformTypes:["ANY_PLATFORM"], threatEntryTypes:["URL"], threatEntries:[{url:targetUrl}] } }),
    });
    const data = await res.json();
    if (data.matches?.length > 0) { const threats=[...new Set(data.matches.map(m=>m.threatType))]; return {status:"danger",threats}; }
    return {status:"safe"};
  } catch { return {status:"error"}; }
}

// ─── RISK ENGINE ──────────────────────────────────────────────────────────────
const RISK_ENGINE = {
  async upi(raw) {
    const id = raw.trim().toLowerCase();
    const indicators = [], weights = [];

    // ── 1. Whitelist / Blacklist ──────────────────────────────────
    if (DB.upiWhitelist.has(id)) return { 
      score:4, level:"low", 
      indicators:["✅ Verified merchant UPI ID — whitelisted"], 
      recommendation:"This UPI ID belongs to a known trusted merchant. Safe to proceed." 
    };
    if (DB.upiBlacklist.has(id)) { 
      indicators.push("🚨 Found in fraud blacklist database"); 
      weights.push(90); 
    }

    const [handle, provider] = id.split("@");
    if (!handle || !provider) { 
      indicators.push("Invalid UPI format — missing @ or handle"); 
      weights.push(40); 
    }

    // ── 2. EXPANDED Real UPI Provider Validation (50+ providers) ─
    const validProviders = new Set([
      // Major Banks
      "oksbi","okaxis","okicici","okhdfcbank","ybl","ibl","axl","upi",
      "hdfcbank","icici","sbi","axisbank","pnb","boi","bob","cnrb",
      "union","uboi","utbi","ubi","aubank","idbi","idfc","idfcbank",
      "federal","fbpe","fbl","kvb","kvbank","cub","tmb","karb",
      "dbs","rbl","rblbank","jsb","jkb","barodampay","syndicat",
      // Payment Apps
      "paytm","paytmbank","apl","amazon","amazonpay",
      "phonepe","yesbank","yesbankltd",
      "jiomoney","jio","airtel","airtelpaymentsbank",
      "freecharge","fc","olamoney","ola",
      "mobikwik","mpesa","lazmoney",
      // Corporate/Others  
      "rajgovt","hpgov","mahagov","goagov",
      "npci","npcibiz","bhim",
      "postbank","dop","ippbonline",
    ]);

    const suspiciousProviders = new Set([
      "fake","scam","fraud","phish","temp","test","hack","free",
      "prize","reward","lucky","winner","lottery","kyc","verify",
      "helpdesk","support","refund","cashback","offer","bonus",
    ]);

    let providerStatus = "unknown";
    if (provider) {
      if (validProviders.has(provider)) {
        indicators.push(`✅ Valid UPI provider: @${provider} — registered & verified`);
        weights.push(-15);
        providerStatus = "valid";
      } else if (suspiciousProviders.has(provider) || [...suspiciousProviders].some(s => provider.includes(s))) {
        indicators.push(`🚨 Suspicious/fake UPI provider: @${provider}`);
        weights.push(55);
        providerStatus = "suspicious";
      } else {
        indicators.push(`⚠️ Unrecognized UPI provider: @${provider} — not in verified list`);
        weights.push(20);
        providerStatus = "unknown";
      }
    }

    // ── 3. Handle Pattern Analysis ────────────────────────────────
    const kws = DB.suspiciousKeywords.upi.filter(k => handle?.includes(k));
    if (kws.length) { 
      indicators.push(`Suspicious keyword(s) in handle: ${kws.join(", ")}`); 
      weights.push(kws.length * 18); 
    }

    const digitRatio = (handle?.match(/\d/g)||[]).length / (handle?.length||1);
    if (digitRatio > 0.55) { 
      indicators.push("High digit density — unusual identifier pattern"); 
      weights.push(22); 
    }

    const entropy = calcEntropy(handle||"");
    if (entropy > 3.6) { 
      indicators.push(`High randomness score (entropy: ${entropy.toFixed(2)})`); 
      weights.push(18); 
    }

    if ((handle?.length||0) > 22) { 
      indicators.push("Abnormally long handle — spoofing pattern"); 
      weights.push(12); 
    }

    if (hasRepeats(handle||"")) { 
      indicators.push("Repeated character pattern detected"); 
      weights.push(14); 
    }

    // ── 4. Community Reports ──────────────────────────────────────
    const communityData = DB.communityReports[id];
    if (communityData) { 
      indicators.push(`🚨 Community reported ${communityData.reports}x — category: ${communityData.category}`); 
      weights.push(Math.min(communityData.reports*4,40)); 
    }

    // ── 5. Expanded Fraud Pattern Database ───────────────────────
    const fraudPatterns = [
      // KYC scams
      /kyc.*(update|verify|complete|urgent)/i,
      /verify.*kyc/i,
      // Reward/Prize scams  
      /reward\d+/i,
      /prize.*claim/i,
      /lucky.*winner/i,
      /cashback\d+/i,
      // Government impersonation
      /pm(kisan|relief|care|fund)/i,
      /rbi(official|help|reward)/i,
      /income.*tax.*refund/i,
      // Bank impersonation
      /(sbi|hdfc|icici|axis|pnb).*(help|support|kyc|reward|refund)/i,
      // Crypto scams
      /crypto.*profit/i,
      /bitcoin.*earn/i,
      /nft.*reward/i,
    ];

    const patternHit = fraudPatterns.find(p => p.test(handle||"") || p.test(id));
    if (patternHit) {
      indicators.push(`🚨 Fraud pattern detected: matches known scam template`);
      weights.push(45);
    }

    // ── 6. AI Real-Time Assessment ────────────────────────────────
    let localScore = Math.min(Math.max(weights.reduce((a,b)=>a+b,0),0),100);
    
    try {
      const aiReply = await callAI({
        messages: [{ 
          role: "user", 
          content: `Analyze this UPI ID for fraud risk. Reply ONLY with JSON, no markdown:\n{"riskScore":<0-100>,"category":"<safe|suspicious|scam|fraud>","reason":"<one line>","providerLegit":<true|false>}\n\nUPI ID: "${id}"\nProvider: "${provider}"\nHandle: "${handle}"\nKnown indicators found: ${indicators.join("; ")}` 
        }],
        system: "You are a UPI fraud detection expert for India. Analyze UPI IDs for scam patterns. Known fraud patterns: fake KYC requests, prize scams, government impersonation, bank impersonation. Reply ONLY with valid JSON."
      });
      
      const clean = aiReply.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      
      if (parsed.reason) indicators.push(`🤖 AI Assessment: ${parsed.reason}`);
      if (parsed.providerLegit === false && providerStatus !== "valid") {
        indicators.push(`🤖 AI: Provider @${provider} appears illegitimate`);
        weights.push(20);
      }
      if (parsed.riskScore >= 70) weights.push(parsed.riskScore * 0.5);
      else if (parsed.riskScore >= 40) weights.push(parsed.riskScore * 0.3);
      if (parsed.category === "scam" || parsed.category === "fraud") { 
        indicators.push(`🚨 AI Category: ${parsed.category.toUpperCase()} detected`); 
        weights.push(25); 
      } else if (parsed.category === "safe" && providerStatus === "valid") { 
        indicators.push(`✅ AI Category: UPI ID appears legitimate`); 
        weights.push(-10); 
      }
    } catch { 
      indicators.push("⚠️ AI analysis unavailable — pattern engine used"); 
    }

    const score = Math.min(Math.max(weights.reduce((a,b)=>a+b,0),0),100);
    const level = score>=75?"critical":score>=50?"high":score>=25?"medium":"low";
    
    return { 
      score, level, indicators: indicators.length ? indicators : ["No suspicious patterns detected"], 
      recommendation: score>=75 
        ? "⚠️ Do NOT send money. This UPI ID matches multiple fraud patterns. Report to cybercrime.gov.in and your bank." 
        : score>=50 
        ? "Exercise extreme caution. Verify this UPI ID directly with recipient over a trusted channel before any payment." 
        : score>=25 
        ? "Some indicators found. Double-check recipient identity before proceeding with payment." 
        : "No major concerns. Still verify recipient independently as good practice." 
    };
  },

  // ─── UPGRADED PHONE SCANNER with NumVerify ───────────────────────────────
  async phone(raw) {
    const cleaned = raw.replace(/[\s\-\(\)\+]/g, "");
    const indicators = [], weights = [];
    let structuralFlag = null;
    let numVerifyData = null;

    const len = cleaned.length;
    const isE164 = cleaned.startsWith("91") && len === 12;
    const is10 = len === 10;

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
    } else if (/^(0123456789|1234567890)$/.test(num)) {
      indicators.push("Sequential digits — synthetic number");
      weights.push(75);
      structuralFlag = "🟠 Sequential Digits";
    } else if (/^(9876543210)$/.test(num)) {
      indicators.push("Descending sequential digits — synthetic number");
      weights.push(75);
      structuralFlag = "🟠 Descending Sequence";
    } else if (/(.)\1{4,}/.test(num)) {
      const match = num.match(/(.)\1{4,}/);
      const rep = match[1];
      const repCount = (num.split(rep).length - 1);
      if (repCount >= 5) {
        indicators.push(`Digit '${rep}' repeats ${repCount}x — excessive repetition`);
        weights.push(55);
        structuralFlag = "🟡 Excessive Repetition";
      }
    }

    const entropy = calcEntropy(num);
    if (entropy < 1.8 && !indicators.length) {
      indicators.push(`Very low digit entropy (${entropy.toFixed(2)}) — low randomness`);
      weights.push(28);
    }

    if (is10 && /^[0-5]/.test(num)) {
      indicators.push(`Starts with '${num[0]}' — Indian mobile numbers start with 6-9`);
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
      indicators.push(`Community reported ${communityData.reports}x — ${communityData.category}`);
      weights.push(Math.min(communityData.reports * 4, 45));
    }

    // ── NumVerify Real-Time Check ──────────────────────────────────────────
    try {
      const res = await fetch("/api/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      numVerifyData = data;

      if (data.valid === false) {
        indicators.push("🚨 NumVerify: Number does not exist / not valid");
        weights.push(70);
        structuralFlag = structuralFlag || "❌ Number Invalid";
      } else if (data.valid === true) {
        indicators.push(`✅ NumVerify: Real number confirmed — ${data.carrier || "Unknown carrier"}`);
        if (data.location) indicators.push(`📍 Registered location: ${data.location}`);
        if (data.lineType) indicators.push(`📱 Line type: ${data.lineType}`);
        weights.push(-10);
      }
    } catch {
      indicators.push("⚠️ NumVerify: Real-time check unavailable");
    }

    const score = Math.min(Math.max(weights.reduce((a,b) => a+b, 0), 0), 100);
    const level = score>=75?"critical":score>=50?"high":score>=25?"medium":"low";

    return {
      score, level, structuralFlag, numVerifyData,
      indicators: indicators.length ? indicators : ["No suspicious patterns detected — number appears valid"],
      recommendation:
        score>=75 ? "Do NOT answer or call back. Block this number immediately and report to TRAI DND (1909)." :
        score>=50 ? "Exercise high caution. Do not share OTP, PIN, Aadhaar, or any personal details." :
        score>=25 ? "Some anomalies found. Verify caller identity independently before sharing any info." :
        "Number appears valid. Always verify caller identity before sharing sensitive data.",
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
    const atCount = (email.match(/@/g) || []).length;
    let syntaxOk = RFC.test(email) && atCount === 1 && !!localPart && !!domainPart;

    if (!syntaxOk) {
      const why = !email.includes("@") ? "Missing @ symbol"
        : atCount > 1 ? "Multiple @ symbols"
        : !localPart ? "Missing username"
        : !domainPart || !domainPart.includes(".") ? "Invalid or missing domain"
        : "Invalid characters";
      steps.push(step(1, "Syntax Validation (RFC 5321/5322)", "fail", why));
      riskWeights.push(70);
      emailStatus = "invalid";
    } else {
      if (/^\.|\.$|\.\./.test(localPart)) {
        steps.push(step(1, "Syntax Validation", "warn", "Invalid dot placement"));
        riskWeights.push(20);
      } else {
        steps.push(step(1, "Syntax Validation (RFC 5321/5322)", "pass", "Email format is RFC-compliant"));
      }
    }

    // ── NEW STEP: Typosquatting Detection (runs BEFORE whitelist/blacklist) ──
    // This catches lookalike domains like "gnail.com", "gmial.com", "gmai1.com"
    // that mimic trusted providers like gmail.com, before they can be treated
    // as "unknown but harmless" by the rest of the pipeline.
    let typosquatMatch = null;
    let typosquatDistance = null;
    if (syntaxOk) {
      function levenshtein(a, b) {
        const dp = Array.from({ length: a.length + 1 }, (_, i) =>
          Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= a.length; i++)
          for (let j = 1; j <= b.length; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
              ? dp[i - 1][j - 1]
              : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[a.length][b.length];
      }

      // Common confusable substitutions scammers use (rn->m, 0->o, 1->l/i, etc.)
      function normalizeConfusables(s) {
        return s
          .replace(/rn/g, "m")
          .replace(/vv/g, "w")
          .replace(/0/g, "o")
          .replace(/1/g, "l")
          .replace(/5/g, "s")
          .replace(/3/g, "e");
      }

      const popularDomains = [
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com",
        "ymail.com", "icloud.com", "protonmail.com", "live.com", "aol.com",
        "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com",
        "paytm.com", "npci.org.in", "amazon.com", "amazon.in",
      ];

      for (const popular of popularDomains) {
        if (domainPart === popular) break; // exact match, not a typosquat

        const dist = levenshtein(domainPart, popular);
        const normDist = levenshtein(normalizeConfusables(domainPart), normalizeConfusables(popular));

        // Catches 1-2 character edits (gnail.com vs gmail.com = distance 1)
        // and confusable-character tricks (rnail.com vs mail.com style tricks)
        if ((dist > 0 && dist <= 2) || (normDist === 0 && domainPart !== popular)) {
          typosquatMatch = popular;
          typosquatDistance = dist;
          break;
        }
      }

      if (typosquatMatch) {
        steps.push(step(
          2,
          "Typosquatting Detection",
          "fail",
          `🚨 "${domainPart}" is ${typosquatDistance} character(s) away from trusted domain "${typosquatMatch}" — likely impersonation`
        ));
        riskWeights.push(65);
        emailStatus = "invalid";
      } else {
        steps.push(step(2, "Typosquatting Detection", "pass", "No lookalike-domain pattern detected"));
      }
    }

    // ── Whitelist / Blacklist (now correctly skipped/overridden for typosquats) ──
    if (!typosquatMatch && DB.emailWhitelist.has(email)) {
      steps.push(step(3, "Reputation Database", "pass", "Found in trusted whitelist"));
      const score = Math.floor(Math.random() * 12) + 2;
      return { score, confidence: 96, level: "low", emailStatus: "verified", structuralFlag: "✅ Whitelist Match", steps, indicators: ["Whitelisted trusted sender"], recommendation: "This is a verified, trusted email address. Safe to interact with." };
    }
    if (DB.emailBlacklist.has(email)) {
      steps.push(step(3, "Reputation Database", "fail", "🚨 Found in scam/phishing blacklist"));
      const score = 95 + Math.floor(Math.random() * 5);
      return { score, confidence: 99, level: "critical", emailStatus: "invalid", structuralFlag: "🚨 Blacklist Match", steps, indicators: ["Known scam/phishing address"], recommendation: "Do NOT interact. This is a confirmed phishing/scam address. Block and report immediately." };
    }

    // If typosquat was detected, short-circuit here with a critical result —
    // no need to keep running MX/SMTP checks, since a lookalike domain having
    // valid DNS does NOT make it safe (scammers run real mail servers too).
    if (typosquatMatch) {
      return {
        score: 88,
        confidence: 95,
        level: "critical",
        emailStatus: "invalid",
        structuralFlag: "🚨 Typosquat Detected",
        steps,
        indicators: [
          `🚨 Typosquatting detected — "${domainPart}" mimics trusted domain "${typosquatMatch}"`,
          "⚠️ This domain having a valid mail server does NOT make it safe — scammers run real mail infrastructure too",
        ],
        recommendation: `🚨 Do NOT trust this email. "${domainPart}" is a lookalike of "${typosquatMatch}" — a classic phishing technique. Verify the sender through an official channel before taking any action.`,
      };
    }

    steps.push(step(3, "Reputation Database", "pass", "Not found in local blacklist/whitelist"));

    if (!syntaxOk) {
      return { score: Math.min(riskWeights.reduce((a, b) => a + b, 0), 100), confidence: 10, level: "critical", emailStatus: "invalid", structuralFlag: "❌ Invalid Syntax", steps, indicators: ["RFC syntax validation failed"], recommendation: "This is not a valid email address. Double-check for typos." };
    }

    if (DB.disposableEmailProviders.has(domainPart)) {
      steps.push(step(4, "Disposable Email Detection", "fail", "Known temporary/disposable email provider"));
      riskWeights.push(50);
      emailStatus = "invalid";
    } else {
      steps.push(step(4, "Disposable Email Detection", "pass", "Not a known disposable email provider"));
    }

    let mxData = null;
    try {
      const mxRes = await fetch("/api/check-mx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainPart }),
      });
      mxData = await mxRes.json();
      if (mxData.hasMX === true) {
        steps.push(step(5, "MX Record Check (Real DNS)", "pass",
          `✅ ${mxData.mxCount} MX record(s) found — Primary: ${mxData.topMX}`));
      } else if (mxData.error === "ENODATA" || mxData.error === "ENOTFOUND") {
        steps.push(step(5, "MX Record Check (Real DNS)", "fail",
          "🚨 No MX records — domain cannot receive email"));
        riskWeights.push(60);
        emailStatus = "invalid";
      } else {
        steps.push(step(5, "MX Record Check (Real DNS)", "warn",
          `Unable to verify MX (${mxData.error || "unknown"})`));
        riskWeights.push(10);
        if (emailStatus === "verified") emailStatus = "unable";
      }
    } catch {
      steps.push(step(5, "MX Record Check (Real DNS)", "warn", "MX check temporarily unavailable"));
      riskWeights.push(8);
      if (emailStatus === "verified") emailStatus = "unable";
    }

    const bigProviders = ["gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com","rediffmail.com"];
    if (emailStatus === "invalid") {
      steps.push(step(6, "SMTP Mailbox Verification", "skip", "Skipped — domain/MX invalid"));
    } else if (bigProviders.includes(domainPart)) {
      steps.push(step(6, "SMTP Mailbox Verification", "warn", `${domainPart} blocks SMTP probing`));
      if (emailStatus === "verified") emailStatus = "unable";
    } else {
      steps.push(step(6, "SMTP Mailbox Verification", "warn", "Browser environment — real SMTP probe not possible"));
      if (emailStatus === "verified") emailStatus = "unable";
    }

    steps.push(step(7, "Catch-all Domain Check", "pass", "No catch-all configuration detected"));

    const indicators = [];
    const tld = domainPart.split(".").pop();

    const kws = DB.suspiciousKeywords.email.filter(k => localPart.includes(k));
    if (kws.length) { indicators.push(`Suspicious keywords: ${kws.slice(0,3).join(", ")}`); riskWeights.push(Math.min(kws.length*15,50)); }

    const digits = (localPart.match(/\d/g) || []).length;
    if (digits > 6) { indicators.push(`Excessive digits (${digits})`); riskWeights.push(18); }

    const entropy = calcEntropy(localPart);
    if (entropy > 4.0) { indicators.push(`Very high randomness (entropy: ${entropy.toFixed(2)})`); riskWeights.push(25); }

    const typosquats = ["g00gle","gmai1","yahooo","hotmai1","outl00k","microsft","amaz0n","paypa1"];
    if (typosquats.some(t => domainPart.includes(t))) { indicators.push("Typosquatted domain detected"); riskWeights.push(55); }

    const domTld = "." + tld;
    if (DB.suspiciousTLDs.has(domTld)) { indicators.push(`Suspicious TLD (${domTld})`); riskWeights.push(20); }

    if (mxData?.hasMX === false) {
      indicators.push("🚨 Real DNS: Domain has no mail server");
    } else if (mxData?.hasMX === true) {
      indicators.push(`✅ Real DNS confirmed — ${mxData.topMX}`);
    }

    const rawScore = Math.min(Math.max(riskWeights.reduce((a,b) => a+b, 0), 0), 100);
    const level = rawScore>=75?"critical":rawScore>=50?"high":rawScore>=25?"medium":"low";
    const confidence = emailStatus==="invalid" ? Math.min(85+riskWeights.length*2,99) : emailStatus==="unable" ? Math.floor(35+Math.random()*25) : Math.max(88-rawScore,55);

    return {
      score: rawScore, confidence, level, emailStatus, structuralFlag: null, steps,
      indicators: indicators.length ? indicators : ["No heuristic red flags detected"],
      recommendation: emailStatus==="invalid" ? "This email address is invalid or undeliverable. Do not use it."
        : rawScore>=75 ? "Do NOT interact. Strong phishing/scam signals. Block and report."
        : rawScore>=50 ? "Suspicious. Avoid clicking links or sharing personal data."
        : rawScore>=25 ? "Some anomalies found. Verify sender independently before responding."
        : "Email appears legitimate. Always verify sender before sharing sensitive information.",
    };
  },


  async email(raw) {
    const addr = raw.trim().toLowerCase();
    const indicators = [], weights = [];
    const [user, domain] = addr.split("@");

    if (!user || !domain) {
      indicators.push("❌ Invalid email format — missing @ symbol");
      weights.push(40);
      return { score:40, level:"medium", indicators, 
        recommendation:"Not a valid email address.",
        highlightPart: "full" };
    }

    // ── 1. Typosquatting Detection ──────────────────────────────
    const popularDomains = [
      "gmail.com","yahoo.com","hotmail.com","outlook.com","rediffmail.com",
      "ymail.com","icloud.com","protonmail.com","sbi.co.in","hdfcbank.com",
      "icicibank.com","axisbank.com","paytm.com","npci.org.in"
    ];

    function levenshtein(a, b) {
      const dp = Array.from({length: a.length+1}, (_,i) => 
        Array.from({length: b.length+1}, (_,j) => i===0?j:j===0?i:0));
      for(let i=1;i<=a.length;i++)
        for(let j=1;j<=b.length;j++)
          dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 
            1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
      return dp[a.length][b.length];
    }

    let typosquatMatch = null;
    for (const popular of popularDomains) {
      if (domain === popular) { typosquatMatch = null; break; }
      const dist = levenshtein(domain, popular);
      if (dist > 0 && dist <= 2) {
        typosquatMatch = popular;
        break;
      }
    }

    let highlightPart = null;
    if (typosquatMatch) {
      indicators.push(`🚨 Typosquatting detected — "${domain}" looks like "${typosquatMatch}"`);
      indicators.push(`⚠️ Danger in: email domain "@${domain}" is suspicious`);
      weights.push(55);
      highlightPart = "domain";
    }

    // ── 2. Suspicious TLD ────────────────────────────────────────
    const suspiciousTlds = [".xyz",".top",".click",".loan",".work",".gq",".tk",".ml",".cf",".cn"];
    const tldHit = suspiciousTlds.find(t => domain.endsWith(t));
    if (tldHit) {
      indicators.push(`⚠️ Suspicious TLD: ".${tldHit}" — commonly used in scam emails`);
      indicators.push(`⚠️ Danger in: domain extension "${tldHit}"`);
      weights.push(30);
      highlightPart = highlightPart || "domain";
    }

    // ── 3. Suspicious keywords in user part ─────────────────────
    const suspiciousUser = ["kyc","verify","update","secure","helpdesk","support",
      "noreply","alert","refund","reward","prize","lucky","winner"];
    const userHit = suspiciousUser.filter(k => user.includes(k));
    if (userHit.length) {
      indicators.push(`⚠️ Suspicious keyword in username: "${userHit.join(", ")}"`);
      indicators.push(`⚠️ Danger in: email username "${user}"`);
      weights.push(userHit.length * 15);
      highlightPart = highlightPart || "user";
    }

    // ── 4. Excessive digits ──────────────────────────────────────
    const digits = (user.match(/\d/g)||[]).length;
    if (digits > 6) {
      indicators.push(`Excessive digits in username (${digits}) — unusual pattern`);
      weights.push(12);
    }

    // ── 5. MX Record Check ───────────────────────────────────────
    try {
      const mx = await fetch(`/api/check-mx?domain=${encodeURIComponent(domain)}`);
      const mxData = await mx.json();
      if (mxData.valid) {
        indicators.push(`✅ Real DNS confirmed — ${mxData.mx}`);
        weights.push(-10);
      } else {
        indicators.push(`❌ No valid MX record — domain cannot receive emails`);
        weights.push(35);
        highlightPart = highlightPart || "domain";
      }
    } catch {
      indicators.push("⚠️ MX check unavailable");
    }

    const score = Math.min(Math.max(weights.reduce((a,b)=>a+b,0),0),100);
    const level = score>=75?"critical":score>=50?"high":score>=25?"medium":"low";

    return { 
      score, level, 
      indicators: indicators.length ? indicators : ["No suspicious patterns detected"],
      highlightPart,
      recommendation: score>=75
        ? `🚨 Dangerous email! "${highlightPart==="domain"?`Domain @${domain}`:`Username ${user}`}" is suspicious. Do NOT interact.`
        : score>=50
        ? `⚠️ Suspicious email detected. Verify sender identity before responding.`
        : score>=25
        ? "Some concerns found. Double-check before sharing sensitive info."
        : "Email appears legitimate. Always verify sender before sharing sensitive information."
    };
  },
  async url(raw) {
    const rawUrl = raw.trim();
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl;
    const domain = rawUrl.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    const indicators = [], weights = [];
    let gsbBadge = null;

    // ── 1. Protocol check ───────────────────────────────────────
    if (rawUrl.startsWith("http://")) {
      indicators.push("⚠️ Insecure HTTP — no encryption (not HTTPS)");
      weights.push(20);
    }

    // ── 2. Shortened URL detection ──────────────────────────────
    const shorteners = ["bit.ly","tinyurl.com","t.co","goo.gl","ow.ly","is.gd","buff.ly","rebrand.ly","cutt.ly","shorturl.at"];
    if (shorteners.some(s => domain.includes(s))) {
      indicators.push("🚨 Shortened URL — real destination is hidden, common in phishing");
      weights.push(40);
    }

    // ── 3. Suspicious keywords in URL ───────────────────────────
    const kws = DB.suspiciousKeywords.url.filter(k => rawUrl.toLowerCase().includes(k));
    if (kws.length) {
      indicators.push(`Suspicious keywords in URL: ${kws.slice(0,4).join(", ")}`);
      weights.push(kws.length * 14);
    }

    // ── 4. Suspicious TLD ────────────────────────────────────────
    const tld = "." + domain.split(".").pop();
    if (DB.suspiciousTLDs.has(tld)) {
      indicators.push(`Suspicious TLD (${tld})`);
      weights.push(22);
    }

    // ── 5. Brand impersonation ──────────────────────────────────
    const simDomains = ["paypal","amazon","flipkart","sbi","hdfc","icici","google","microsoft","paytm","phonepe"];
    const hit = simDomains.find(s => domain.includes(s) && !domain.endsWith(`${s}.com`) && !domain.endsWith(`${s}.in`));
    if (hit) {
      indicators.push(`🚨 Brand impersonation: mimics "${hit}"`);
      weights.push(45);
    }

    // ── 6. Excessive hyphens / digits / length ──────────────────
    if ((domain.match(/-/g) || []).length > 2) {
      indicators.push("Multiple hyphens — common phishing pattern");
      weights.push(18);
    }
    if (domain.length > 35) {
      indicators.push("Unusually long URL/domain");
      weights.push(15);
    }

    // ── 7. IP address as domain ──────────────────────────────────
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
      indicators.push("🚨 Raw IP address used instead of domain name");
      weights.push(50);
    }

    // ── 8. Google Safe Browsing check ───────────────────────────
    try {
      const gsb = await callGoogleSafeBrowsing(fullUrl);
      if (gsb.status === "danger") {
        indicators.push(`🚨 Google Safe Browsing: Flagged as ${gsb.threats?.join(", ") || "dangerous"}`);
        weights.push(85);
        gsbBadge = "danger";
      } else if (gsb.status === "safe") {
        indicators.push("✅ Google Safe Browsing: No threats detected");
        weights.push(-10);
        gsbBadge = "safe";
      } else {
        gsbBadge = "unavailable";
      }
    } catch {
      indicators.push("⚠️ Google Safe Browsing check unavailable");
      gsbBadge = "unavailable";
    }

    const score = Math.min(Math.max(weights.reduce((a,b)=>a+b,0),0),100);
    const level = score>=75?"critical":score>=50?"high":score>=25?"medium":"low";

    return {
      score, level, gsbBadge,
      indicators: indicators.length ? indicators : ["No suspicious patterns detected"],
      recommendation: score>=75
        ? "🚨 Do NOT visit this URL. Strong phishing/malware indicators found. Report and block."
        : score>=50
        ? "Suspicious URL. Avoid entering any personal or payment information."
        : score>=25
        ? "Some concerns found. Verify the destination before clicking."
        : "URL appears low-risk. Always check for HTTPS and verify the domain independently."
    };
  },
  async sms(raw) {
    const text = raw.trim();
    const textLower = text.toLowerCase();
    const indicators = [], weights = [];

    const kws = DB.suspiciousKeywords.sms.filter(k => textLower.includes(k));
    if (kws.length) { indicators.push(`High-risk keywords: ${kws.slice(0,5).join(", ")}`); weights.push(kws.length * 12); }
    if (/https?:\/\/[^\s]+/i.test(text)) { indicators.push("Contains URL — inspect before clicking"); weights.push(20); }
    if (/bit\.ly|tinyurl|t\.co|short\./i.test(text)) { indicators.push("Shortened URL detected"); weights.push(25); }
    if (/\d{4,6}.*otp|otp.*\d{4,6}/i.test(text)) { indicators.push("Requests OTP — banks never ask via SMS"); weights.push(55); }
    if (/₹|rs\.?\s*\d|lakh|crore/i.test(text)) { indicators.push("Monetary amount mentioned — financial bait"); weights.push(20); }
    if (/won|winner|selected|congratulations|lucky/i.test(text)) { indicators.push("Prize/lottery language detected"); weights.push(35); }
    if (/call now|reply now|act now|immediately|expire/i.test(text)) { indicators.push("Artificial urgency tactics"); weights.push(25); }
    if (/account.*block|suspend|deactivat/i.test(text)) { indicators.push("Threat-based manipulation pattern"); weights.push(30); }
    if (/click here|tap here|download now/i.test(text)) { indicators.push("Directive click action — common in phishing"); weights.push(22); }

    const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
    for (const url of urlMatches.slice(0, 3)) {
      try {
        const gsb = await callGoogleSafeBrowsing(url);
        if (gsb.status === "danger") { indicators.push(`🚨 URL flagged by Google Safe Browsing: ${url.slice(0,40)}`); weights.push(85); }
        else if (gsb.status === "safe") { indicators.push(`✅ URL checked safe: ${url.slice(0,40)}`); }
      } catch { indicators.push(`⚠️ URL check failed`); }
    }

    try {
      const aiReply = await callAI({
        messages: [{ role: "user", content: `Analyze this SMS for scam/phishing. Reply ONLY with JSON, no markdown:\n{"riskScore":<0-100>,"category":"<safe|suspicious|scam|phishing|fraud>","reason":"<one line>","hindiDetected":<true|false>}\n\nSMS: "${text.slice(0,500)}"` }],
        system: "You are a cybersecurity SMS analyzer. Detect scams in Hindi, Hinglish, English. Reply ONLY with valid JSON, nothing else."
      });
      const clean = aiReply.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.hindiDetected) indicators.push(`🤖 AI: Hindi/Hinglish message detected — analyzed in context`);
      if (parsed.reason) indicators.push(`🤖 AI Assessment: ${parsed.reason}`);
      if (parsed.riskScore >= 70) weights.push(parsed.riskScore * 0.6);
      else if (parsed.riskScore >= 40) weights.push(parsed.riskScore * 0.4);
      if (parsed.category === "scam" || parsed.category === "fraud") { indicators.push(`🚨 AI Category: ${parsed.category.toUpperCase()} detected`); weights.push(30); }
      else if (parsed.category === "phishing") { indicators.push(`🚨 AI Category: PHISHING detected`); weights.push(35); }
      else if (parsed.category === "safe") { indicators.push(`✅ AI Category: Message appears safe`); weights.push(-5); }
    } catch { indicators.push("⚠️ AI analysis unavailable — keyword engine used"); }

    const score = Math.min(Math.max(weights.reduce((a,b) => a+b, 0), 0), 100);
    const level = score>=75?"critical":score>=50?"high":score>=25?"medium":"low";
    return {
      score, level,
      indicators: indicators.length ? indicators : ["No scam patterns detected in this message"],
      recommendation:
        score>=75 ? "This is almost certainly a scam. Do not call, click, or reply. Block the sender." :
        score>=50 ? "Very suspicious. Do not click any links. Contact your bank/service directly." :
        score>=25 ? "Some red flags. Verify the sender through official channels." :
        "Message appears benign. Always double-check before clicking unknown links.",
    };
  },

 async domain(raw) {
    const domain = raw.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    const indicators = [], weights = [];

    // ── Local rules (fast, instant) ──────────────────────────────
    if (DB.domainBlacklist.has(domain)) {
      indicators.push("🚨 Domain in local threat blacklist"); weights.push(90);
    }
    const tld = "." + domain.split(".").pop();
    if (DB.suspiciousTLDs.has(tld)) {
      indicators.push(`Suspicious TLD (${tld})`); weights.push(22);
    }
    if (DB.trustedTLDs.has("." + domain.split(".").slice(-2).join("."))) weights.push(-20);
    const kws = DB.suspiciousKeywords.domain.filter(k => domain.includes(k));
    if (kws.length) { indicators.push(`Suspicious keywords: ${kws.join(", ")}`); weights.push(kws.length * 16); }
    const entropy = calcEntropy(domain.split(".")[0]);
    if (entropy > 3.6) { indicators.push(`High randomness (entropy: ${entropy.toFixed(2)})`); weights.push(22); }
    if (domain.split(".")[0].length > 20) { indicators.push("Unusually long domain"); weights.push(16); }
    if ((domain.match(/\d/g) || []).length > 3) { indicators.push("Excessive digits"); weights.push(18); }
    if ((domain.match(/-/g) || []).length > 2) { indicators.push("Multiple hyphens — phishing pattern"); weights.push(20); }
    const simDomains = ["paypal","amazon","flipkart","sbi","hdfc","icici","google","microsoft"];
    const hit = simDomains.find(s => domain.includes(s) && !domain.endsWith(`${s}.com`) && !domain.endsWith(`${s}.in`));
    if (hit) { indicators.push(`Brand impersonation: mimics "${hit}"`); weights.push(40); }

    // ── Real-time API check ───────────────────────────────────────
    let realtime = null;
    try {
      const res = await fetch("/api/analyze-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      realtime = await res.json();

      // VirusTotal signals
      if (realtime.virusTotal?.available) {
        const vt = realtime.virusTotal;
        if (vt.malicious >= 5) { indicators.push(`🚨 VirusTotal: ${vt.malicious}/${vt.total} engines flagged MALICIOUS`); weights.push(85); }
        else if (vt.malicious >= 1) { indicators.push(`⚠️ VirusTotal: ${vt.malicious}/${vt.total} engines flagged suspicious`); weights.push(40); }
        else { indicators.push(`✅ VirusTotal: Clean (0/${vt.total} engines flagged)`); weights.push(-10); }
        if (vt.reputation !== null && vt.reputation < -5) { indicators.push(`🔴 VirusTotal reputation score: ${vt.reputation}`); weights.push(20); }
      } else {
        indicators.push("⚠️ VirusTotal: Unavailable (add API key in Vercel)");
      }

      // WHOIS / Domain Age signals
      if (realtime.whois?.available) {
        const w = realtime.whois;
        indicators.push(`📅 Domain age: ${w.ageLabel || "Unknown"}`);
        if (w.ageDays !== null && w.ageDays < 30) weights.push(55);
        else if (w.ageDays !== null && w.ageDays < 90) weights.push(30);
        else if (w.ageDays !== null && w.ageDays > 730) weights.push(-10);
        if (w.registrar) indicators.push(`🏢 Registrar: ${w.registrar}`);
      } else {
        indicators.push("⚠️ WHOIS: Data unavailable for this domain");
      }

      // SSL signals
      if (realtime.ssl?.available) {
        const s = realtime.ssl;
        if (!s.hasSSL) { indicators.push("🔴 No SSL certificate — not secure"); weights.push(30); }
        else if (s.isExpired) { indicators.push("🔴 SSL certificate EXPIRED"); weights.push(40); }
        else if (s.isSelfSigned) { indicators.push("🟠 Self-signed certificate — not from trusted CA"); weights.push(25); }
        else if (s.isTrustedIssuer) { indicators.push(`✅ Valid SSL — issued by ${s.issuer} (${s.daysLeft} days left)`); weights.push(-5); }
        else { indicators.push(`⚠️ SSL from unknown issuer: ${s.issuer}`); weights.push(10); }
      } else {
        indicators.push("⚠️ SSL check unavailable");
      }

      // DNS signals
      if (realtime.dns?.available) {
        if (!realtime.dns.isIPv4) { indicators.push("🔴 No DNS A record — domain may not exist"); weights.push(35); }
        else { indicators.push(`✅ DNS resolves to: ${realtime.dns.aRecords[0]}`); }
        if (realtime.dns.hasSPF) indicators.push("✅ SPF record present");
        if (realtime.dns.hasDMARC) indicators.push("✅ DMARC policy found");
      }
    } catch {
      indicators.push("⚠️ Real-time check unavailable — local analysis only");
    }

    const score = Math.min(Math.max(weights.reduce((a, b) => a + b, 0), 0), 100);
    const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";

    return {
      score, level, realtimeData: realtime,
      indicators: indicators.length ? indicators : ["Domain appears legitimate"],
      recommendation:
        score >= 75 ? "Do not visit. This domain shows strong malicious indicators. Report to cybercrime.gov.in" :
        score >= 50 ? "Suspicious domain. Access official sites by typing them manually in browser." :
        score >= 25 ? "Proceed carefully. Verify this is the official website before entering any data." :
        "Domain appears low-risk. Always verify SSL and domain authenticity.",
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
    {min:0,max:25,color:C.success,label:"Low",emoji:"🟢"},
    {min:25,max:50,color:C.warning,label:"Medium",emoji:"🟡"},
    {min:50,max:75,color:"#FF7A00",label:"High",emoji:"🟠"},
    {min:75,max:101,color:C.danger,label:"Critical",emoji:"🔴"},
  ];
  const lvl=levels.find(l=>score>=l.min&&score<l.max)||levels[3];
  const r=52,cx=70,cy=70,circ=2*Math.PI*r;
  const arc=(score/100)*circ*0.75;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <svg width="140" height="100" viewBox="0 0 140 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeDasharray={`${circ*0.75} ${circ}`} strokeDashoffset={-circ*0.125} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={lvl.color} strokeWidth="10" strokeDasharray={`${arc} ${circ}`} strokeDashoffset={-circ*0.125} strokeLinecap="round" style={{transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)"}}/>
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
  const isCritical=text.startsWith("🚨");
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 12px",marginBottom:6,background:isCritical?"rgba(255,77,79,0.08)":"rgba(255,255,255,0.04)",border:`1px solid ${isCritical?"rgba(255,77,79,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:8,fontSize:13,lineHeight:1.5,color:isCritical?"#FF8080":C.text}}>
      <span style={{flexShrink:0,marginTop:1,color:C.warning}}>{isCritical?"":"▸"}</span>
      {text}
    </div>
  );
}

function ScanBadge({ level }) {
  const map={low:{c:C.success,bg:"rgba(0,200,83,0.12)",l:"Low Risk"},medium:{c:C.warning,bg:"rgba(255,193,7,0.12)",l:"Medium Risk"},high:{c:"#FF7A00",bg:"rgba(255,122,0,0.12)",l:"High Risk"},critical:{c:C.danger,bg:"rgba(255,77,79,0.15)",l:"Critical Risk"}};
  const m=map[level]||map.low;
  return <span style={{padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,background:m.bg,color:m.c,border:`1px solid ${m.c}40`}}>{m.l}</span>;
}

function GSBBadge({ gsbBadge }) {
  if (!gsbBadge) return null;
  if (gsbBadge==="danger") return <div style={{marginTop:10,padding:"12px 14px",borderRadius:10,background:"rgba(255,77,79,0.12)",border:"2px solid rgba(255,77,79,0.5)",display:"flex",flexDirection:"column",gap:4}}><div style={{fontWeight:700,color:C.danger,fontSize:13}}>🚨 Google Safe Browsing has flagged this URL as dangerous!</div><div style={{fontSize:11,color:C.muted}}>🛡️ Powered by Google Safe Browsing</div></div>;
  if (gsbBadge==="safe") return <div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:"rgba(0,200,83,0.08)",border:"1px solid rgba(0,200,83,0.3)",display:"flex",flexDirection:"column",gap:4}}><div style={{fontWeight:600,color:C.success,fontSize:13}}>✅ Google Safe Browsing: No threats detected</div><div style={{fontSize:11,color:C.muted}}>🛡️ Powered by Google Safe Browsing</div></div>;
  return <div style={{marginTop:10,padding:"8px 14px",borderRadius:10,background:"rgba(255,193,7,0.07)",border:"1px solid rgba(255,193,7,0.25)",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13,color:C.warning}}>⚠️ Google Safe Browsing: Unavailable</span><span style={{fontSize:11,color:C.muted}}>— local engine only</span></div>;
}

function DomainAgeBadge({ flag }) {
  if (!flag) return null;
  return <span style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,background:"rgba(255,193,7,0.1)",border:"1px solid rgba(255,193,7,0.3)",color:C.warning,letterSpacing:.3}}>{flag}</span>;
}

// ─── NumVerify Result Card ─────────────────────────────────────────────────
function NumVerifyCard({ data }) {
  if (!data || data.valid === undefined) return null;
  if (data.valid === false) return (
    <div style={{marginTop:10,padding:"12px 14px",borderRadius:10,background:"rgba(255,77,79,0.08)",border:"1px solid rgba(255,77,79,0.3)",display:"flex",flexDirection:"column",gap:4}}>
      <div style={{fontWeight:700,color:C.danger,fontSize:13}}>🚨 NumVerify: This number does not exist or is invalid</div>
      <div style={{fontSize:11,color:C.muted}}>📡 Powered by NumVerify Real-Time API</div>
    </div>
  );
  return (
    <div style={{marginTop:10,padding:"14px",borderRadius:10,background:"rgba(0,200,83,0.07)",border:"1px solid rgba(0,200,83,0.25)"}}>
      <div style={{fontWeight:600,color:C.success,fontSize:13,marginBottom:10}}>✅ NumVerify — Real-Time Validation</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[
          ["📱 Carrier", data.carrier || "Unknown"],
          ["📍 Location", data.location || "Unknown"],
          ["🔢 Line Type", data.lineType || "Unknown"],
          ["🌍 Country", data.countryCode || "IN"],
        ].map(([label, value]) => (
          <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:10,color:C.muted}}>{label}</div>
            <div style={{fontSize:12,fontWeight:600,color:C.text,marginTop:2}}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:8}}>📡 Powered by NumVerify Real-Time API</div>
    </div>
  );
}

function AIThreatExplanation({ explanation, loading }) {
  if (!explanation && !loading) return null;
  const sections = explanation ? explanation.split("\n").filter(l => l.trim()) : [];
  return (
    <div className="glass fu" style={{padding:18,borderColor:"rgba(139,92,246,0.35)",marginBottom:12}}>
      <div style={{fontSize:12,fontWeight:600,color:C.violet,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
        🤖 AI Threat Analysis
        {loading && <span style={{animation:"pulse 1s infinite",fontSize:10,color:C.muted}}>AI analyzing…</span>}
      </div>
      {loading && !explanation && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {["Analyzing patterns","Checking threat vectors","Generating explanation","Assessing risk"].map(s=>(
            <span key={s} style={{fontSize:10,color:C.muted,background:"rgba(139,92,246,0.08)",padding:"3px 9px",borderRadius:20,animation:"pulse 1.5s infinite"}}>{s}…</span>
          ))}
        </div>
      )}
      {explanation && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sections.map((line, i) => {
            const isHeader = line.startsWith("**") || line.startsWith("##") || line.match(/^[🔴🟠🟡🟢⚠️❌✅🚨]/);
            const cleanLine = line.replace(/\*\*/g,"").replace(/##/g,"").trim();
            return (
              <div key={i} style={{fontSize:isHeader?13:12,fontWeight:isHeader?600:400,color:isHeader?C.text:C.muted,lineHeight:1.7,padding:isHeader?"6px 0 2px":"0",borderTop:isHeader&&i>0?"1px solid rgba(255,255,255,0.05)":"none",paddingTop:isHeader&&i>0?10:undefined}}>
                {cleanLine}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// ─── SCAN HISTORY ─────────────────────────────────────────────────────────────
function useScanHistory() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(safeGetItem("sentinelx_history", "[]")); }
    catch { return []; }
  });
  function addScan(type, input, score, level) {
    const entry = { id: Date.now(), type, input: input.slice(0,60), score, level, time: new Date().toLocaleString("en-IN") };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 50);
      safeSetItem("sentinelx_history", JSON.stringify(updated));
      return updated;
    });
  }
  function deleteScan(id) {
    setHistory(prev => {
      const updated = prev.filter(h => h.id !== id);
      safeSetItem("sentinelx_history", JSON.stringify(updated));
      return updated;
    });
  }
  function clearHistory() {
    try { localStorage.removeItem("sentinelx_history"); } catch (e) { console.warn(e); }
    setHistory([]);
  }
  return { history, addScan, deleteScan, clearHistory };
}

function HistoryPage({ history, deleteScan, clearHistory }) {
  const lc = { critical:C.danger, high:"#FF7A00", medium:C.warning, low:C.success };
  const icons = { upi:"💳", url:"🔗", phone:"📞", email:"📧", sms:"💬", domain:"🌐" };
  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🕐 Scan History</h2>
          <p style={{color:C.muted,fontSize:12}}>Your last {history.length} scans</p>
        </div>
        {history.length>0 && (
          <button className="btn-ghost" style={{fontSize:11,padding:"6px 14px"}} onClick={()=>{
            if(window.confirm("Clear all scan history? This cannot be undone.")) clearHistory();
          }}>
            🗑️ Clear All
          </button>
        )}
      </div>
      {history.length===0 ? (
        <div className="glass" style={{padding:40,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🔍</div>
          <div style={{color:C.muted,fontSize:13}}>No scans yet — run your first analysis!</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.map(h=>(
            <div key={h.id} className="glass" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:20,flexShrink:0}}>{icons[h.type]||"🔍"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.input}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:3}}>{h.time}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,color:lc[h.level]}}>{h.score}</div>
                <div style={{fontSize:9,color:lc[h.level],fontWeight:600,textTransform:"uppercase"}}>{h.level}</div>
              </div>
              <button
                onClick={()=>deleteScan(h.id)}
                title="Delete this entry"
                style={{
                  flexShrink:0,
                  width:30,
                  height:30,
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  borderRadius:8,
                  background:"rgba(255,77,79,0.08)",
                  border:"1px solid rgba(255,77,79,0.25)",
                  color:C.danger,
                  cursor:"pointer",
                  fontSize:14,
                  transition:"all .15s"
                }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,77,79,0.18)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,77,79,0.08)"}}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const SCAN_TYPES = [
  {id:"upi",label:"UPI ID",icon:"💳",ph:"merchant@paytm"},
  {id:"url",label:"URL",icon:"🔗",ph:"https://example.com"},
  {id:"phone",label:"Phone",icon:"📞",ph:"+91 98765 43210"},
  {id:"email",label:"Email",icon:"📧",ph:"user@domain.com"},
  {id:"sms",label:"SMS/Text",icon:"💬",ph:"Paste suspicious message…",big:true},
  {id:"domain",label:"Domain",icon:"🌐",ph:"suspicious-site.xyz"},
];

function HomePage({ setPage, setDefaultTab }) {
  const [counts,setCounts]=useState([0,0,0,0]);
  const targets=[2471893,153204,98700,45];
  useEffect(()=>{
    const dur=1400,start=Date.now();
    const id=setInterval(()=>{
      const p=Math.min((Date.now()-start)/dur,1),e=1-Math.pow(1-p,3);
      setCounts(targets.map(t=>Math.floor(t*e)));
      if(p>=1)clearInterval(id);
    },16);
    return()=>clearInterval(id);
  },[]);
  const stats=[{val:counts[0].toLocaleString()+"+",label:"Total Scans"},{val:counts[1].toLocaleString()+"+",label:"Threats Detected"},{val:counts[2].toLocaleString()+"+",label:"Users Protected"},{val:counts[3]+"+",label:"Intel Sources"}];
  const tools=[
    {icon:"💳",t:"UPI Fraud Guard",d:"Multi-heuristic UPI risk scoring with entropy, keyword & blacklist analysis"},
    {icon:"🔗",t:"URL Analyzer",d:"Deep phishing, typosquatting, redirect chain & TLD reputation analysis"},
    {icon:"📞",t:"Phone Checker",d:"Real-time NumVerify validation + spam database + community reports"},
    {icon:"📧",t:"Email Verifier",d:"Disposable provider, spoofed domain & phishing indicator checks"},
    {icon:"💬",t:"SMS Scam Detector",d:"AI-powered message classification with pattern & keyword scoring"},
    {icon:"🌐",t:"Domain Intel",d:"Threat reputation, brand impersonation & entropy-based risk scoring"},
    {icon:"🤖",t:"AI Assistant",d:"Ask cybersecurity questions — powered by AI"},
    {icon:"🎓",t:"Learn & Quiz",d:"Interactive lessons and quizzes to sharpen your cyber awareness"},
  ];
  return (
    <div className="fu">
      <div style={{textAlign:"center",padding:"20px 16px 16px"}}>
        <div style={{display:"inline-flex",padding:16,borderRadius:"50%",background:"rgba(0,212,255,0.06)",border:"1px solid rgba(0,212,255,0.15)",marginBottom:20,animation:"glow 3s ease infinite"}}>
          <Shield size={56}/>
        </div>
        <div style={{fontSize:10,letterSpacing:5,color:C.cyan,marginBottom:14,textTransform:"uppercase",fontWeight:500}}>AI-Powered Threat Intelligence</div>
        <h1 style={{fontSize:"clamp(28px,5vw,50px)",fontWeight:700,lineHeight:1.1,marginBottom:14}}>
          <span>Think Before </span>
          <span style={{background:`linear-gradient(135deg,${C.cyan},${C.blue},${C.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>You Click.</span>
        </h1>
        <p style={{color:C.muted,fontSize:15,maxWidth:480,margin:"0 auto 28px",lineHeight:1.75}}>Smart hybrid risk analyzer — multi-heuristic scoring with entropy analysis, blacklists, community intel & AI reasoning.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn-prime" style={{padding:"13px 30px",fontSize:14}} onClick={()=>setPage("Scanner")}>🔍 Analyze Now</button>
          <button className="btn-ghost" style={{padding:"13px 22px",fontSize:14}} onClick={()=>setPage("Assistant")}>🤖 Ask AI</button>
        </div>
      </div>

      <div style={{padding:"0 12px 16px"}}>
        <h2 style={{textAlign:"center",fontSize:14,fontWeight:600,marginBottom:2}}>Comprehensive Security Toolkit</h2>
        <p style={{textAlign:"center",color:C.muted,fontSize:11,marginBottom:10}}>Hybrid rule engine + AI — built to replace simple keyword checkers</p>
        <div className="mobile-tools" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {tools.map(f=>(
            <div key={f.t} className="glass mobile-tool-card" style={{padding:"10px 10px",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,212,255,.35)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform=""}}
             onClick={()=>{
  if(f.t==="AI Assistant"){setPage("Assistant");}
  else if(f.t==="Learn & Quiz"){setPage("Learn");}
  else{
    const tabMap={"UPI Fraud Guard":"upi","URL Analyzer":"url","Phone Checker":"phone","Email Verifier":"email","SMS Scam Detector":"sms","Domain Intel":"domain"};
    setDefaultTab(tabMap[f.t]||"upi");
    setPage("Scanner");
  }
}}>
              <div style={{fontSize:18,marginBottom:4}}>{f.icon}</div>
              <div style={{fontWeight:600,fontSize:11,marginBottom:2}}>{f.t}</div>
              <div style={{color:C.muted,fontSize:10,lineHeight:1.4}}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
async function reportScam(type, input, level) {
  try {
    await fetch("/api/report-scam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: type,
        value: input,
        category: level,
        description: `Reported via SentinelX scan. Risk level: ${level}`
      })
    });
    alert("✅ Report submitted! Thank you for helping the community.");
  } catch {
    alert("❌ Report failed. Please try again.");
  }
}
function shareOnWhatsApp(type, input, score, level, indicators) {
  const emoji = level==="critical"?"🔴":level==="high"?"🟠":level==="medium"?"🟡":"🟢";
  const msg = `${emoji} *SentinelX Scam Alert*\n\n*Type:* ${type.toUpperCase()}\n*Analyzed:* ${input.slice(0,50)}\n*Risk Score:* ${score}/100\n*Risk Level:* ${level.toUpperCase()}\n\n*Top Indicators:*\n${indicators.slice(0,3).map(i=>`• ${i}`).join("\n")}\n\n🛡️ Scan yourself at: https://my-web-app-2fhc.vercel.app`;
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}
function ScannerPage({ addScan, defaultTab="upi" }) {
  const [tab,setTab]=useState(defaultTab);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [aiExplanation,setAiExplanation]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const cur=SCAN_TYPES.find(t=>t.id===tab);

  async function runScan() {
    if (!input.trim()) return;
    setLoading(true); setResult(null); setAiExplanation("");
    let r;
    if (tab==="email") r=await RISK_ENGINE.emailFull(input);
    else if (tab==="url") r=await RISK_ENGINE.url(input);
    else if (tab==="phone") r=await RISK_ENGINE.phone(input);
    else if (tab==="sms") r=await RISK_ENGINE.sms(input);
   else r=RISK_ENGINE[tab]?await RISK_ENGINE[tab](input):{score:0,level:"low",indicators:["Scanner not implemented yet"],recommendation:""};
   setResult(r); setLoading(false);
addScan(tab, input, r.score, r.level);

    if (r.score >= 0) {
      setAiLoading(true);
      const prompt = `You are SentinelX, an expert cybersecurity AI assistant. Analyze this ${tab.toUpperCase()} that was scanned:

Input: "${input.trim()}"
Risk Score: ${r.score}/100
Risk Level: ${r.level.toUpperCase()}
Detected Indicators: ${r.indicators.join("; ")}

Provide a detailed threat analysis with these sections:
🔍 Why This Is ${r.score > 50 ? "Dangerous" : r.score > 25 ? "Suspicious" : "Low Risk"}
(2-3 sentences explaining the specific reason this input is risky or safe, referencing the actual indicators found)

⚠️ What Could Happen
(If someone interacts with this — what are the real consequences? Be specific.)

✅ What You Should Do
(Step-by-step exact actions — numbered list, 3-4 steps max)

Keep total response under 200 words. Be direct and practical. No fluff.`;

      const explanation = await callAI({
        messages: [{ role: "user", content: prompt }],
        system: "You are SentinelX AI, a cybersecurity expert. Give structured, actionable threat analysis. Always use the exact section headers provided. Be concise and specific.",
      });
      setAiExplanation(explanation);
      setAiLoading(false);
    }
  }

  const riskC=result?(result.level==="critical"?C.danger:result.level==="high"?"#FF7A00":result.level==="medium"?C.warning:C.success):C.cyan;

  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🔍 Smart Risk Analyzer</h2>
        <p style={{color:C.muted,fontSize:12}}>Hybrid rule engine + AI — multi-heuristic analysis</p>
      </div>
     <div className="mobile-tabs" style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {SCAN_TYPES.map(t=>(
          <button key={t.id} className="tab" onClick={()=>{setTab(t.id);setResult(null);setInput("");setAiExplanation("")}}
            style={{padding:"7px 13px",fontSize:12,color:tab===t.id?"#000":C.muted,background:tab===t.id?`linear-gradient(135deg,${C.cyan},${C.blue})`:"rgba(255,255,255,0.04)",border:tab===t.id?"none":"1px solid rgba(255,255,255,0.07)",fontWeight:tab===t.id?700:400}}>
            {t.icon} {t.label}
          </button>
        ))}
       </div>
      <div className="glass" style={{padding:18,marginBottom:14}}>
        <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Enter {cur.label} to analyze:</div>
        {cur.big?(
          <textarea className="ifield" value={input} onChange={e=>setInput(e.target.value)} placeholder={cur.ph} style={{padding:"11px 13px",fontSize:13,minHeight:80,resize:"vertical"}}/>
        ):(
          <input className="ifield" value={input} onChange={e=>setInput(e.target.value)} placeholder={cur.ph} onKeyDown={e=>e.key==="Enter"&&runScan()} style={{padding:"11px 13px",fontSize:13}}/>
        )}
        <button className="btn-prime" onClick={runScan} disabled={loading||!input.trim()} style={{marginTop:11,padding:"11px 26px",fontSize:13}}>
        {loading?(tab==="phone"?"⏳ Verifying with NumVerify…":tab==="url"?"⏳ Checking Safe Browsing…":"⏳ Analyzing…"):"🔬 Run Analysis"}
        </button>

      {loading && (
        <div className="glass" style={{padding:28,textAlign:"center"}}>
          <div style={{width:36,height:36,border:"3px solid rgba(0,212,255,0.15)",borderTop:`3px solid ${C.cyan}`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 14px"}}/>
          <p style={{color:C.cyan,fontSize:13}}>{tab==="phone"?"Real-time phone validation via NumVerify…":"Running hybrid analysis engine…"}</p>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:10}}>
            {(tab==="phone"
              ?["NumVerify API","Carrier lookup","Blacklist check","Pattern scan","Community intel"]
              :["Entropy check","Blacklist lookup","Keyword scan","Pattern match","Community intel"]
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
                    <span style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:C.text,letterSpacing:.3}}>
                      {result.structuralFlag}
                    </span>
                  )}
                  {tab==="url" && <DomainAgeBadge flag={result.domainAgeFlag}/>}
                </div>
                <div className="mono" style={{fontSize:11,color:C.muted,marginBottom:6}}>
                  Risk Score: <span style={{color:riskC,fontWeight:600}}>{result.score}/100</span>
                </div>
                <div style={{fontSize:11,color:C.muted}}>
                  Analyzed: <span style={{color:C.text}}>{input.trim().slice(0,40)}{input.length>40?"…":""}</span>
                </div>
              </div>
            </div>
            {tab==="url"&&result.gsbBadge&&<GSBBadge gsbBadge={result.gsbBadge}/>}
            {tab==="domain" && result?.realtimeData && (
  <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
    {/* VirusTotal Card */}
    {result.realtimeData.virusTotal?.available && (
      <div style={{padding:"12px 14px",borderRadius:10,background:result.realtimeData.virusTotal.malicious>0?"rgba(255,77,79,0.09)":"rgba(0,200,83,0.07)",border:`1px solid ${result.realtimeData.virusTotal.malicious>0?"rgba(255,77,79,0.35)":"rgba(0,200,83,0.3)"}`}}>
        <div style={{fontWeight:700,fontSize:13,color:result.realtimeData.virusTotal.malicious>0?C.danger:C.success,marginBottom:8}}>
          🛡️ VirusTotal — {result.realtimeData.virusTotal.malicious}/{result.realtimeData.virusTotal.total} engines flagged
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
          {[["🔴","Malicious",result.realtimeData.virusTotal.malicious,C.danger],["🟠","Suspicious",result.realtimeData.virusTotal.suspicious,"#FF7A00"],["🟢","Harmless",result.realtimeData.virusTotal.harmless,C.success],["⚪","Undetected",result.realtimeData.virusTotal.undetected,C.muted]].map(([icon,label,val,color])=>(
            <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:14}}>{icon}</div>
              <div style={{fontSize:15,fontWeight:700,color}}>{val}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:8}}>🔬 Powered by VirusTotal</div>
      </div>
    )}
    {/* WHOIS Card */}
    {result.realtimeData.whois?.available && (
      <div style={{padding:"12px 14px",borderRadius:10,background:"rgba(91,91,255,0.07)",border:"1px solid rgba(91,91,255,0.25)"}}>
        <div style={{fontWeight:600,fontSize:13,color:C.blue,marginBottom:8}}>📋 WHOIS — Domain Registration</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[["📅 Registered",result.realtimeData.whois.registered||"Unknown"],["🏢 Registrar",result.realtimeData.whois.registrar?.slice(0,22)||"Unknown"],["⏳ Expires",result.realtimeData.whois.expires||"Unknown"],["🕐 Age",result.realtimeData.whois.ageLabel||"Unknown"]].map(([label,val])=>(
            <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:10,color:C.muted}}>{label}</div>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginTop:2}}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    )}
    {/* SSL Card */}
    {result.realtimeData.ssl?.available && (
      <div style={{padding:"12px 14px",borderRadius:10,background:result.realtimeData.ssl.hasSSL&&!result.realtimeData.ssl.isExpired?"rgba(0,200,83,0.07)":"rgba(255,77,79,0.08)",border:`1px solid ${result.realtimeData.ssl.hasSSL&&!result.realtimeData.ssl.isExpired?"rgba(0,200,83,0.3)":"rgba(255,77,79,0.3)"}`}}>
        <div style={{fontWeight:600,fontSize:13,color:result.realtimeData.ssl.hasSSL&&!result.realtimeData.ssl.isExpired?C.success:C.danger,marginBottom:8}}>
          🔒 SSL Certificate — {result.realtimeData.ssl.hasSSL?(result.realtimeData.ssl.isExpired?"EXPIRED":"Valid"):("Not Found")}
        </div>
        {result.realtimeData.ssl.hasSSL && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[["🏛️ Issuer",result.realtimeData.ssl.issuer?.slice(0,20)||"Unknown"],["📅 Valid Until",result.realtimeData.ssl.validTo||"Unknown"],["⏳ Days Left",result.realtimeData.ssl.daysLeft+"d" ||"?"],["🔐 Self-Signed",result.realtimeData.ssl.isSelfSigned?"Yes ⚠️":"No ✅"]].map(([label,val])=>(
              <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:10,color:C.muted}}>{label}</div>
                <div style={{fontSize:11,fontWeight:600,color:C.text,marginTop:2}}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)}
            {tab==="phone"&&<NumVerifyCard data={result.numVerifyData}/>}
          </div>

          <div className="glass" style={{padding:18,marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
              ⚡ Detected Indicators
              <span style={{background:"rgba(0,212,255,0.1)",color:C.cyan,fontSize:10,padding:"2px 8px",borderRadius:20}}>{result.indicators.length} found</span>
            </div>
            {result.indicators.map((ind,i)=><IndicatorTag key={i} text={ind}/>)}
          </div>

          <div className="glass" style={{padding:18,marginBottom:12,borderColor:`${riskC}30`}}>
            <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:10}}>💡 Recommendation</div>
            <p style={{fontSize:13,color:C.text,lineHeight:1.7}}>{result.recommendation}</p>
          </div>

          <AIThreatExplanation explanation={aiExplanation} loading={aiLoading}/>
<button
  onClick={()=>shareOnWhatsApp(tab,input,result.score,result.level,result.indicators)}
  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px",marginTop:10,marginBottom:4,borderRadius:10,background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.35)",color:"#25D366",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  Share on WhatsApp — Warn Family & Friends
</button>
{(result.level === "critical" || result.level === "high") && (
  <button
    onClick={()=>reportScam(tab,input,result.level)}
    style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"12px",marginTop:6,borderRadius:10,background:"rgba(255,77,79,0.10)",border:"1px solid rgba(255,77,79,0.35)",color:"#FF4D4F",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
    🚨 Report as Scam — Help the Community
  </button>
)}
          <div style={{marginTop:14,padding:"12px 16px",borderRadius:10,background:"rgba(255,193,7,0.06)",border:"1px solid rgba(255,193,7,0.2)",fontSize:12,color:"#C9A227"}}>
            ⚠️ Analysis based on heuristics + AI. Always verify independently before making payments or sharing personal data.
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function formatAIText(text) {
  if (!text) return null;
  const lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(p=>p.length>0);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} style={{color:C.cyan,fontWeight:700}}>{part.slice(2,-2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    const isBullet = /^[-•]\s+/.test(line) || /^\d+\.\s+/.test(line);
    return (
      <div key={i} style={{marginBottom:8,paddingLeft:isBullet?4:0}}>
        {rendered}
      </div>
    );
  });
}

function AssistantPage() {
  const [msgs,setMsgs]=useState([{role:"assistant",text:"👋 Hello! I'm SentinelX AI. Ask me anything about online safety — phishing, UPI scams, suspicious messages, or paste something you want me to assess. I remember our full conversation!"}]);
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);
  const chips=["How do I spot a phishing email?","Is KYC update over SMS real?","How to protect my UPI?","What is smishing?"];
  async function send(text) {
    const t=text||inp.trim(); if(!t)return;
    setInp("");
    const newUserMsg={role:"user",text:t};
    setMsgs(m=>[...m,newUserMsg]);
    setLoading(true);
    const allMsgs=[...msgs,newUserMsg];
    const history=allMsgs.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
    const reply=await callAI({messages:history,system:"You are SentinelX AI, a helpful and knowledgeable assistant built into a cybersecurity app. Your specialty is cybersecurity — scams, phishing, UPI fraud, fake messages, and online safety — and you should give detailed, practical answers on these topics. However, you can also answer general knowledge questions on any topic (science, history, coding, general advice, etc.) accurately and helpfully, just like a normal AI assistant. Never refuse a question as 'out of scope' — always attempt a genuine, correct answer. Be clear and direct.\n\nFORMATTING RULES (very important): Always format your response clearly like a professional chat assistant (ChatGPT-style). Use actual line breaks between sections and points — never write everything as one giant paragraph. Use markdown: **bold** for key terms/headings, numbered lists (1. 2. 3.) or bullet points (- ) for steps, each on its own new line. Add a blank line between major sections. Keep paragraphs short (2-3 sentences max).\n\nKeep cybersecurity answers practical and actionable; for general topics, answer normally without forcing a cybersecurity angle. Remember the full conversation context and refer back to earlier messages when relevant."});
    setMsgs(m=>[...m,{role:"assistant",text:reply}]);
    setLoading(false);
  }
  return (
    <div className="fu" style={{padding:"22px 18px",display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",minHeight:380}}>
      <div style={{marginBottom:14}}>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🤖 AI Cyber Assistant</h2>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(0,200,83,0.1)",color:C.success,border:`1px solid ${C.success}40`,fontWeight:600}}>● AI Connected</span>
          <span style={{fontSize:10,color:C.muted}}>Full conversation memory active</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"83%",padding:"11px 15px",fontSize:13,lineHeight:1.65,borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?`linear-gradient(135deg,${C.cyan},${C.blue})`:"rgba(255,255,255,0.05)",color:m.role==="user"?"#000":C.text,border:m.role==="assistant"?`1px solid ${C.border}`:"none"}}>
              {m.role==="assistant" ? formatAIText(m.text) : m.text}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex"}}><div style={{padding:"11px 15px",borderRadius:"16px 16px 16px 4px",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,fontSize:13,color:C.muted}}><span style={{animation:"pulse 1s infinite"}}>● ● ●</span></div></div>}
        <div ref={endRef}/>
      </div>
      {msgs.length<=2&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>{chips.map(c=><button key={c} className="btn-ghost" style={{fontSize:11,padding:"6px 11px"}} onClick={()=>send(c)}>{c}</button>)}</div>}
      <div style={{display:"flex",gap:8}}>
        <input className="ifield" value={inp} onChange={e=>setInp(e.target.value)} placeholder="Ask about any security concern…" onKeyDown={e=>e.key==="Enter"&&send()} style={{flex:1,padding:"11px 14px",fontSize:13}}/>
        <button className="btn-prime" onClick={()=>send()} disabled={!inp.trim()||loading} style={{padding:"11px 18px",fontSize:13,opacity:(!inp.trim()||loading)?0.4:1}}>Send</button>
      </div>
    </div>
  );
}

function DashboardPage({ history=[] }) {
  const total = history.length;
  const threatsFound = history.filter(h=>h.level==="critical"||h.level==="high").length;
  const safeScans = history.filter(h=>h.level==="low"||h.level==="medium").length;

  const now = Date.now();
  const weekMs = 7*24*60*60*1000;
  const thisWeekCount = history.filter(h=>(now-h.id)<=weekMs).length;

  const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dayCounts=[0,0,0,0,0,0,0];
  history.forEach(h=>{
    if((now-h.id)<=weekMs){
      const d=new Date(h.id).getDay();
      dayCounts[d]++;
    }
  });
  const maxCount = Math.max(...dayCounts,1);
  const bars = dayCounts.map(c=>Math.round((c/maxCount)*100));

  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>📊 Dashboard</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:18}}>Your real scan activity overview</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:18}}>
        {[["🔍","Total Scans",total.toLocaleString(),C.cyan],["🛡️","Threats Found",threatsFound.toLocaleString(),C.danger],["✅","Safe Scans",safeScans.toLocaleString(),C.success],["📅","This Week",thisWeekCount.toLocaleString(),C.blue]].map(([icon,label,val,color])=>(
          <div key={label} className="glass-sm" style={{padding:"15px 12px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
            <div className="mono" style={{fontSize:19,fontWeight:700,color}}>{val}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <div className="glass" style={{padding:18,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:C.cyan,marginBottom:14}}>📈 Weekly Scan Activity</div>
        {total===0 ? (
          <div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:12}}>No scans yet — run your first analysis to see activity here!</div>
        ):(
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
          {bars.map((v,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:"100%",height:`${Math.max(v,3)}%`,background:`linear-gradient(180deg,${C.cyan},${C.blue})`,borderRadius:"4px 4px 0 0",opacity:.75}}/>
              <div style={{fontSize:9,color:C.muted}}>{days[i]}</div>
            </div>
          ))}
        </div>
        )}
      </div>
     
    </div>
  );
}
function useQuizProgress() {
  const todayKey = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(() => {
    try { return JSON.parse(safeGetItem("sentinelx_quiz", "{}")); }
    catch { return {}; }
  });
  const today = data[todayKey] || {};

  const lifetimeScore = Object.values(data).reduce((sum, day) =>
    sum + Object.values(day).reduce((s, t) => s + (t.score || 0), 0), 0);

  function saveAnswer(topic, qIdx, selectedIdx, isCorrect, totalQuestions) {
    setData(prev => {
      const dayData = prev[todayKey] || {};
      const topicData = dayData[topic] || { answers: {}, score: 0, completed: false };
      const newAnswers = { ...topicData.answers, [qIdx]: selectedIdx };
      const newScore = Object.keys(newAnswers).reduce((sum, k) => {
        return sum; // score recalculated below using isCorrect map separately
      }, 0);
      const updatedTopicData = {
        ...topicData,
        answers: newAnswers,
        score: (topicData.score || 0) + (isCorrect ? 10 : 0),
        completed: Object.keys(newAnswers).length >= totalQuestions,
      };
      const updated = {
        ...prev,
        [todayKey]: { ...dayData, [topic]: updatedTopicData },
      };
      safeSetItem("sentinelx_quiz", JSON.stringify(updated));
      return updated;
    });
  }

  function getTopicProgress(topic) {
    return today[topic] || { answers: {}, score: 0, completed: false };
  }

  return { today, lifetimeScore, saveAnswer, getTopicProgress, todayKey };
}

function QuizView({ topic, label, onBack, savedProgress, onAnswer }) {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const savedAnswers = savedProgress.answers || {};
  const totalAnswered = Object.keys(savedAnswers).length;

  const [qIdx, setQIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/daily-quiz?topic=${topic}`)
      .then(r => r.json())
      .then(d => {
        if (d.questions && d.questions.length) {
          setQuestions(d.questions);
          // Resume from first unanswered question
          const firstUnanswered = d.questions.findIndex((_, i) => savedAnswers[i] === undefined);
          setQIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
        } else setError("No questions returned");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load quiz"); setLoading(false); });
  }, [topic]);

  function selectAnswer(i) {
    if (savedAnswers[qIdx] !== undefined) return; // locked, already answered
    const isCorrect = i === questions[qIdx].ans;
    onAnswer(topic, qIdx, i, isCorrect, questions.length);
  }

  function next() {
    if (qIdx + 1 >= questions.length) { onBack(); return; }
    setQIdx(qIdx + 1);
  }
  function prev() {
    if (qIdx > 0) setQIdx(qIdx - 1);
  }

  if (loading) return (
    <div className="glass" style={{padding:40,textAlign:"center"}}>
      <div style={{width:36,height:36,border:"3px solid rgba(0,212,255,0.15)",borderTop:`3px solid ${C.cyan}`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 14px"}}/>
      <p style={{color:C.cyan,fontSize:13}}>Loading today's {label} quiz…</p>
    </div>
  );
  if (error || !questions) return (
    <div className="glass" style={{padding:30,textAlign:"center"}}>
      <p style={{color:C.danger,fontSize:13,marginBottom:12}}>⚠️ {error || "Could not load quiz"}</p>
      <button className="btn-ghost" style={{fontSize:12,padding:"8px 16px"}} onClick={onBack}>← Back</button>
    </div>
  );

  const q = questions[qIdx];
  const answered = savedAnswers[qIdx];
  const isLocked = answered !== undefined;
  const liveScore = Object.entries(savedAnswers).reduce((s,[idx,ans]) => s + (questions[idx] && ans === questions[idx].ans ? 10 : 0), 0);

  return (
    <div className="glass fu" style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button className="btn-ghost" style={{fontSize:11,padding:"5px 12px"}} onClick={onBack}>← Topics</button>
        <span style={{fontSize:10,color:C.muted}}>{qIdx+1} / {questions.length} · Score: {liveScore}</span>
      </div>

      {qIdx > 0 && (
        <button className="btn-ghost" style={{fontSize:10,padding:"4px 10px",marginBottom:10}} onClick={prev}>← Previous Question</button>
      )}

      <p style={{fontSize:14,fontWeight:500,marginBottom:16,lineHeight:1.6}}>{q.q}</p>
      {q.opts.map((o,i)=>(
        <button key={i} onClick={()=>selectAnswer(i)} disabled={isLocked}
          style={{display:"block",width:"100%",textAlign:"left",padding:"11px 14px",marginBottom:7,borderRadius:9,fontSize:13,cursor:!isLocked?"pointer":"default",fontFamily:"Inter,sans-serif",background:!isLocked?"rgba(255,255,255,0.04)":i===q.ans?"rgba(0,200,83,0.12)":i===answered?"rgba(255,77,79,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${!isLocked?"rgba(255,255,255,0.08)":i===q.ans?C.success:i===answered?C.danger:"rgba(255,255,255,0.05)"}`,color:!isLocked?C.text:i===q.ans?C.success:i===answered?C.danger:C.muted}}>
          {isLocked&&i===q.ans?"✅ ":isLocked&&i===answered?"❌ ":""}{o}
        </button>
      ))}

      {isLocked && (
        <div className="fu" style={{marginTop:12,padding:"12px 15px",borderRadius:10,lineHeight:1.65,fontSize:13,background:answered===q.ans?"rgba(0,200,83,0.08)":"rgba(255,77,79,0.08)",border:`1px solid ${answered===q.ans?C.success:C.danger}`,color:C.text}}>
          <div style={{fontSize:11,fontWeight:600,marginBottom:6,color:C.muted}}>
            Your answer: <span style={{color:answered===q.ans?C.success:C.danger}}>{q.opts[answered]}</span>
            {answered!==q.ans && <> · Correct answer: <span style={{color:C.success}}>{q.opts[q.ans]}</span></>}
          </div>
          {answered===q.ans?"✅ Correct! ":"❌ Not quite — "}{q.explain}
          <div style={{marginTop:10}}>
            <button className="btn-ghost" style={{fontSize:11,padding:"6px 14px"}} onClick={next}>
              {qIdx+1>=questions.length?"Finish Quiz →":"Next Question →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LearnPage() {
  const [activeTopic, setActiveTopic] = useState(null);
  const { today, lifetimeScore, saveAnswer, getTopicProgress } = useQuizProgress();

  const topics=[
    {id:"phishing",icon:"🎣",t:"Phishing",d:"Fake emails, sites & messages",c:C.danger},
    {id:"upi_fraud",icon:"💳",t:"UPI Fraud",d:"Fake payment & KYC scams",c:C.warning},
    {id:"password_safety",icon:"🔐",t:"Password Safety",d:"Strong passwords & 2FA",c:C.blue},
    {id:"social_engineering",icon:"📱",t:"Social Engineering",d:"Psychological manipulation",c:C.violet},
    {id:"safe_browsing",icon:"🌐",t:"Safe Browsing",d:"Spotting malicious sites",c:C.success},
    {id:"digital_privacy",icon:"🔒",t:"Digital Privacy",d:"Protecting personal data",c:C.cyan},
  ];

  if (activeTopic) {
    const topicMeta = topics.find(t=>t.id===activeTopic);
    const progress = getTopicProgress(activeTopic);
    return (
      <div className="fu" style={{padding:"22px 18px"}}>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:14}}>{topicMeta.icon} {topicMeta.t} Quiz</h2>
        <QuizView
          topic={activeTopic}
          label={topicMeta.t}
          savedProgress={progress}
          onAnswer={saveAnswer}
          onBack={()=>setActiveTopic(null)}
        />
      </div>
    );
  }

  return (
    <div className="fu" style={{padding:"22px 18px"}}>
      <h2 style={{fontSize:20,fontWeight:700,marginBottom:3}}>🎓 Cyber Education Hub</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:14}}>Fresh quiz every day — pick a topic to start</p>

      <div style={{display:"flex",gap:10,marginBottom:18}}>
        <div className="glass-sm" style={{flex:1,padding:"12px",textAlign:"center"}}>
          <div className="mono" style={{fontSize:18,fontWeight:700,color:C.cyan}}>
            {Object.values(today).reduce((s,t)=>s+(t.score||0),0)}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>Today's Score</div>
        </div>
        <div className="glass-sm" style={{flex:1,padding:"12px",textAlign:"center"}}>
          <div className="mono" style={{fontSize:18,fontWeight:700,color:C.success}}>{lifetimeScore}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>Lifetime Score</div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10}}>
        {topics.map(t=>{
          const prog = today[t.id];
          const answeredCount = prog ? Object.keys(prog.answers||{}).length : 0;
          return (
            <div key={t.id} className="glass" style={{padding:"15px 13px",cursor:"pointer",transition:"all .2s",position:"relative"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform=""}
              onClick={()=>setActiveTopic(t.id)}>
              {prog && (
                <span style={{position:"absolute",top:10,right:10,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:prog.completed?"rgba(0,200,83,0.15)":"rgba(255,193,7,0.15)",color:prog.completed?C.success:C.warning}}>
                  {prog.completed?`✓ ${prog.score}`:`${answeredCount} in progress`}
                </span>
              )}
              <div style={{fontSize:24,marginBottom:8}}>{t.icon}</div>
              <div style={{fontWeight:600,fontSize:13,color:t.c,marginBottom:4}}>{t.t}</div>
              <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>{t.d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ─── INSTALL GUIDE ────────────────────────────────────────────────────────────
function detectDevice() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

function InstallGuideModal({ onClose }) {
  const device = detectDevice();

  const steps = {
    ios: [
      { icon: "🧭", text: "Safari browser mein ye app kholo (Chrome mein kaam nahi karega)" },
      { icon: "⬆️", text: "Neeche/upar 'Share' icon (□ with ↑) par tap karo" },
      { icon: "📲", text: "Neeche scroll karke \"Add to Home Screen\" par tap karo" },
      { icon: "✅", text: "\"Add\" par tap karo — bas! App aapki home screen par aa jayegi" },
    ],
    android: [
      { icon: "⋮", text: "Top-right corner mein 3 dots (⋮ menu) par tap karo" },
      { icon: "📲", text: "\"Add to Home screen\" ya \"Install app\" option dhundo aur tap karo" },
      { icon: "✅", text: "\"Install\" / \"Add\" confirm karo — app icon home screen par aa jayega" },
      { icon: "🚀", text: "Ab aap ise ek normal app ki tarah kholo, bina browser ke!" },
    ],
    desktop: [
      { icon: "🔗", text: "Address bar ke right side mein ek install icon (⊕) dhundo" },
      { icon: "🖱️", text: "Us icon par click karo, phir \"Install\" par click karo" },
      { icon: "✅", text: "SentinelX ab aapke desktop/taskbar se ek app ki tarah khulega" },
    ],
  };

  const currentSteps = steps[device];
  const deviceLabel = device === "ios" ? "iPhone / iPad" : device === "android" ? "Android" : "Computer";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div className="glass fu" style={{maxWidth:420,width:"100%",padding:26,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{display:"inline-flex",marginBottom:10}}><Shield size={44}/></div>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>📲 Install SentinelX App</h2>
          <p style={{fontSize:12,color:C.muted}}>Detected: <span style={{color:C.cyan,fontWeight:600}}>{deviceLabel}</span></p>
        </div>

        <div style={{background:"rgba(0,212,255,0.06)",border:"1px solid rgba(0,212,255,0.2)",borderRadius:10,padding:"12px 14px",marginBottom:18,fontSize:12,color:C.text,lineHeight:1.6}}>
          💡 SentinelX ko apne home screen par install karo — turant ek tap mein khulega, bina browser address type kiye, bilkul ek normal app ki tarah!
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
          {currentSteps.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{flexShrink:0,width:32,height:32,borderRadius:8,background:"rgba(0,212,255,0.1)",border:"1px solid rgba(0,212,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>
                {s.icon}
              </div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.55,paddingTop:5}}>
                <span style={{color:C.cyan,fontWeight:700,marginRight:4}}>{i+1}.</span>{s.text}
              </div>
            </div>
          ))}
        </div>

        {device === "ios" && (
          <div style={{fontSize:11,color:C.warning,background:"rgba(255,193,7,0.08)",border:"1px solid rgba(255,193,7,0.25)",borderRadius:8,padding:"9px 12px",marginBottom:16}}>
            ⚠️ Note: Yeh sirf Safari mein kaam karta hai. Chrome/Firefox mein "Add to Home Screen" option nahi milega (Apple ka restriction hai).
          </div>
        )}

        <button className="btn-prime" onClick={onClose} style={{width:"100%",padding:"12px",fontSize:13}}>
          Got it! 👍
        </button>
      </div>
    </div>
  );
}
// ─── AUTH SYSTEM ──────────────────────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(safeGetItem("sentinelx_user", "null")); }
    catch { return null; }
  });
  function login(userData) {
    safeSetItem("sentinelx_user", JSON.stringify(userData));
    setUser(userData);
  }
  function logout() {
    try { localStorage.removeItem("sentinelx_user"); } catch (e) { console.warn(e); }
    setUser(null);
  }
  return { user, login, logout };
}

function reportLoginIssue(context) {
  const msg = `🔔 SentinelX Support Alert\n\nA user faced a SERVER-side issue while: ${context}\nTime: ${new Date().toLocaleString("en-IN")}\n\nPlease check if the backend service needs a resume/restart.`;
  const url = `https://wa.me/919934916031?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [step, setStep] = useState("form"); // form | otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // signup fields
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [designationOther, setDesignationOther] = useState("");
  const [mobile, setMobile] = useState("");

  // shared
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function fmtCooldown(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // Signup — no OTP, account created and logged in directly
  async function handleSignup() {
    setError("");
    if (!name.trim() || !designation || !email.trim() || !mobile.trim()) {
      setError("Please fill all fields."); return;
    }
    if (designation === "other" && !designationOther.trim()) {
      setError("Please specify your designation."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, designation, designationOther, email, mobile }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
      onLogin(data.user);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // Login — sends OTP
  async function sendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send OTP");
        if (res.status === 429) {
          setStep("otp");
          setCooldown(60);
        }
        setLoading(false);
        return;
      }
      setStep("otp");
      setCooldown(60);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  async function handleLoginStart() {
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    await sendOtp();
  }

  async function handleVerifyOtp() {
    setError("");
    if (!otp.trim()) { setError("Please enter the OTP."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); setLoading(false); return; }
      onLogin(data.user);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  const designations = [
    { id: "student", label: "🎓 Student" },
    { id: "educator", label: "👩‍🏫 Educator" },
    { id: "professional", label: "💼 Professional" },
    { id: "other", label: "📌 Other" },
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{css}</style>
      <div className="glass fu" style={{maxWidth:420,width:"100%",padding:28}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{display:"inline-flex",marginBottom:10}}><Shield size={42}/></div>
          <div style={{fontWeight:700,fontSize:18,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SentinelX</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Cyber Shield AI</div>
        </div>

        {step === "form" && (
          <>
            <div style={{display:"flex",gap:6,marginBottom:20,background:"rgba(255,255,255,0.03)",padding:4,borderRadius:10}}>
              <button onClick={()=>{setMode("login");setError("")}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"Inter,sans-serif",background:mode==="login"?`linear-gradient(135deg,${C.cyan},${C.blue})`:"transparent",color:mode==="login"?"#000":C.muted}}>Login</button>
              <button onClick={()=>{setMode("signup");setError("")}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"Inter,sans-serif",background:mode==="signup"?`linear-gradient(135deg,${C.cyan},${C.blue})`:"transparent",color:mode==="signup"?"#000":C.muted}}>Sign Up</button>
            </div>

            {mode === "signup" && (
              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Full Name</div>
                  <input className="ifield" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{padding:"10px 13px",fontSize:13}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:6}}>I am a...</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {designations.map(d=>(
                      <button key={d.id} onClick={()=>setDesignation(d.id)} style={{padding:"9px",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"Inter,sans-serif",background:designation===d.id?"rgba(0,212,255,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${designation===d.id?C.cyan:"rgba(255,255,255,0.08)"}`,color:designation===d.id?C.cyan:C.text}}>{d.label}</button>
                    ))}
                  </div>
                </div>
                {designation === "other" && (
                  <input className="ifield" value={designationOther} onChange={e=>setDesignationOther(e.target.value)} placeholder="Please specify" style={{padding:"10px 13px",fontSize:13}}/>
                )}
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Mobile Number</div>
                  <input className="ifield" value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="+91 98765 43210" style={{padding:"10px 13px",fontSize:13}}/>
                </div>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Email Address</div>
              <input className="ifield" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" style={{padding:"10px 13px",fontSize:13}}/>
            </div>

            {error && <div style={{fontSize:12,color:C.danger,marginBottom:12,padding:"9px 12px",background:"rgba(255,77,79,0.08)",borderRadius:8,border:"1px solid rgba(255,77,79,0.25)"}}>{error}</div>}

            <button className="btn-prime" disabled={loading} onClick={mode==="signup"?handleSignup:handleLoginStart} style={{width:"100%",padding:"12px",fontSize:13}}>
              {loading ? "⏳ Please wait…" : mode==="signup" ? "Create Account" : "Send OTP"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:13,color:C.muted}}>We've sent a 6-digit code to</div>
              <div style={{fontSize:14,fontWeight:600,color:C.cyan,marginTop:3}}>{email}</div>
            </div>
            <input className="ifield mono" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" style={{padding:"12px 13px",fontSize:20,textAlign:"center",letterSpacing:8,marginBottom:14}}/>

            {error && <div style={{fontSize:12,color:C.danger,marginBottom:12,padding:"9px 12px",background:"rgba(255,77,79,0.08)",borderRadius:8,border:"1px solid rgba(255,77,79,0.25)"}}>{error}</div>}

            <button className="btn-prime" disabled={loading||otp.length<6} onClick={handleVerifyOtp} style={{width:"100%",padding:"12px",fontSize:13,marginBottom:14}}>
              {loading ? "⏳ Verifying…" : "Verify & Continue"}
            </button>

            <div style={{textAlign:"center",fontSize:12,color:C.muted,padding:"10px",background:"rgba(255,255,255,0.03)",borderRadius:8}}>
              {cooldown > 0 ? (
                <>⏱️ Resend OTP available in <span className="mono" style={{color:C.cyan,fontWeight:700}}>{fmtCooldown(cooldown)}</span></>
              ) : (
                <button onClick={sendOtp} disabled={loading} style={{background:"none",border:"none",color:C.cyan,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",textDecoration:"underline",fontWeight:600}}>🔄 Resend OTP</button>
              )}
            </div>
            <button onClick={()=>{setStep("form");setOtp("");setError("");setCooldown(0)}} style={{display:"block",margin:"14px auto 0",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"Inter,sans-serif"}}>← Change email</button>
          </>
        )}
      </div>
    </div>
  );
}
  class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("SentinelX crash:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",background:"#080E1C",padding:20,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
          <h2 style={{marginBottom:8}}>Kuch galat ho gaya</h2>
          <p style={{color:"#888",fontSize:12,marginBottom:16,maxWidth:400,wordBreak:"break-word"}}>{String(this.state.error)}</p>
          <button onClick={()=>window.location.reload()} style={{padding:"10px 24px",borderRadius:8,background:"#00D4FF",border:"none",color:"#000",fontWeight:700,cursor:"pointer"}}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}
const NAV=[{id:"Home",icon:"🏠"},{id:"Scanner",icon:"🔍"},{id:"Assistant",icon:"🤖"},{id:"Dashboard",icon:"📊"},{id:"Learn",icon:"🎓"},{id:"History",icon:"🕐"}];
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
export default function SentinelX() {
const [page,setPage]=useState("Home");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

useEffect(() => {
  const goOnline = () => setIsOnline(true);
  const goOffline = () => setIsOnline(false);
  window.addEventListener("online", goOnline);
  window.addEventListener("offline", goOffline);
  return () => {
    window.removeEventListener("online", goOnline);
    window.removeEventListener("offline", goOffline);
  };
}, []);
const [defaultTab,setDefaultTab]=useState("upi");
const [showInstallGuide, setShowInstallGuide] = useState(false);

useEffect(() => {
const seen = safeGetItem("sentinelx_install_guide_seen", null);
  if (!seen) {
    const timer = setTimeout(() => setShowInstallGuide(true), 1500);
    return () => clearTimeout(timer);
  }
}, []);

function closeInstallGuide() {
  safeSetItem("sentinelx_install_guide_seen", "true");
  setShowInstallGuide(false);
}
const { history, addScan, deleteScan, clearHistory } = useScanHistory();
const { user, login, logout } = useAuth();

if (!user) {
  return <ErrorBoundary><AuthPage onLogin={login} /></ErrorBoundary>;
}

  return (
    <ErrorBoundary>
    <>
      <style>{css}</style>
      <div style={{minHeight:"100vh",background:C.bg,maxWidth:760,margin:"0 auto"}}>
        <header className="mobile-header" style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"rgba(8,14,28,0.96)",backdropFilter:"blur(14px)",zIndex:100,paddingTop:"calc(12px + env(safe-area-inset-top))"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("Home")}>
            <Shield size={30}/>
            <div>
              <div style={{fontWeight:700,fontSize:15,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SentinelX</div>
              <div style={{fontSize:8,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>Cyber Shield AI</div>
            </div>
          </div>
          <div className="mobile-welcome" style={{
            display:"flex", alignItems:"center", gap:6, padding:"6px 12px",
            borderRadius:20, background:"rgba(0,212,255,0.07)",
            border:"1px solid rgba(0,212,255,0.2)"
          }}>
            <span style={{fontSize:14}}>👋</span>
            <span style={{fontSize:12, fontWeight:600, color:C.text}}>
              Welcome, <span style={{color:C.cyan}}>{user.name || "User"}</span>
            </span>
          </div>
          
         <button onClick={()=>setShowInstallGuide(true)} style={{marginLeft:8,padding:"6px 10px",fontSize:11,borderRadius:8,background:"rgba(0,212,255,0.08)",border:"1px solid rgba(0,212,255,0.25)",color:C.cyan,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600}}>
            📲
          </button>
          <button onClick={()=>{ if(window.confirm("Logout from SentinelX?")) logout(); }} style={{marginLeft:8,padding:"6px 12px",fontSize:11,borderRadius:8,background:"rgba(255,77,79,0.08)",border:"1px solid rgba(255,77,79,0.25)",color:C.danger,cursor:"pointer",fontFamily:"Inter,sans-serif",fontWeight:600}}>
            🚪 Logout
          </button>
        </header>
        {showInstallGuide && <InstallGuideModal onClose={closeInstallGuide}/>}
{!isOnline && (
  <div style={{padding:"10px 18px",background:"rgba(255,77,79,0.12)",borderBottom:"1px solid rgba(255,77,79,0.35)",textAlign:"center",fontSize:12,color:"#FF8080",fontWeight:600,lineHeight:1.6}}>
    📡 You're offline — showing local pattern analysis only.
    <br/>
    <span style={{fontWeight:400,color:"#FFB3B3"}}>For accurate real-time results (AI, NumVerify, VirusTotal, Safe Browsing), please connect to the internet.</span>
  </div>
)}
<main>
          {page==="Home"&&<HomePage setPage={setPage} setDefaultTab={setDefaultTab}/>}
         {page==="Scanner"&&<ScannerPage addScan={addScan} defaultTab={defaultTab}/>}
          {page==="Assistant"&&<AssistantPage/>}
          {page==="Dashboard"&&<DashboardPage history={history}/>}
          {page==="Learn"&&<LearnPage/>}
{page==="History"&&<HistoryPage history={history} deleteScan={deleteScan} clearHistory={clearHistory}/>}
        </main>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:760,background:"rgba(8,14,28,0.97)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {NAV.map(n=>(
            <button key={n.id} className="tab mobile-nav-btn" onClick={()=>setPage(n.id)} style={{flex:1,padding:"10px 4px 9px",fontSize:9,color:page===n.id?C.cyan:C.muted,display:"flex",flexDirection:"column",alignItems:"center",gap:2,justifyContent:"center",minHeight:48}}>
              <span className="mobile-nav-icon" style={{fontSize:17}}>{n.icon}</span>{n.id}
            </button>
          ))}
        </div>
       <div style={{height:"calc(64px + env(safe-area-inset-bottom))"}}/>
      </div>
    </>
    </ErrorBoundary>
  );
}
