/* =========================================================
   MindPulse AI — script.js
   Handles UI state, form collection, FastAPI /predict call,
   gauge animation, and theme switching.

   Scoped to index.html only. insights.html has its own inline
   <script> for scroll-spy + tab switching, since this file
   queries elements (country select, platform grid, calc button)
   that only exist on the predictor page.
   ========================================================= */

// ---------------- Config ----------------
// Change this if your FastAPI server runs on a different host/port.
let API_BASE = "http://127.0.0.1:8000";

const PLATFORMS = [
  { val: "Facebook",  code: "FB" },
  { val: "LinkedIn",  code: "IN" },
  { val: "Instagram", code: "IG" },
  { val: "Snapchat",  code: "SC" },
  { val: "Twitter",   code: "TW" },
  { val: "YouTube",   code: "YT" },
  { val: "TikTok",    code: "TT" },
  { val: "LINE",      code: "LN" },
  { val: "KakaoTalk", code: "KT" },
  { val: "VKontakte", code: "VK" },
  { val: "WhatsApp",  code: "WA" },
  { val: "WeChat",    code: "WC" },
];

const COUNTRIES = ["Afghanistan","Albania","Andorra","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia","Brazil","Bulgaria","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Ecuador","Egypt","Estonia","Finland","France","Georgia","Germany","Ghana","Greece","Hong Kong","Hungary","Iceland","India","Indonesia","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Latvia","Lebanon","Liechtenstein","Lithuania","Luxembourg","Malaysia","Maldives","Malta","Mexico","Moldova","Monaco","Montenegro","Morocco","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway","Oman","Other","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","San Marino","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Thailand","Trinidad","Turkey","UAE","UK","USA","Ukraine","Uruguay","Uzbekistan","Vatican City","Venezuela","Vietnam","Yemen"];

// ---------------- State ----------------
const state = { gender: "Female", platform: "Instagram", purpose: "Entertainment", mood: "Medium" };

// ---------------- Populate dynamic selects/grids ----------------
const countrySel = document.getElementById("country");
COUNTRIES.forEach((c) => {
  const o = document.createElement("option");
  o.value = c;
  o.textContent = c;
  if (c === "USA") o.selected = true;
  countrySel.appendChild(o);
});

const platformGrid = document.getElementById("platformGrid");
PLATFORMS.forEach((p) => {
  const card = document.createElement("div");
  card.className = "platform-card" + (p.val === state.platform ? " active" : "");
  card.dataset.val = p.val;
  card.innerHTML = `<div class="platform-badge">${p.code}</div><span class="label">${p.val}</span>`;
  card.addEventListener("click", () => {
    state.platform = p.val;
    document.querySelectorAll(".platform-card").forEach((el) => el.classList.remove("active"));
    card.classList.add("active");
  });
  platformGrid.appendChild(card);
});

// ---------------- Generic toggle-group wiring ----------------
function wireGroup(containerId, stateKey) {
  const el = document.getElementById(containerId);
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state[stateKey] = btn.dataset.val;
      el.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}
wireGroup("genderSeg", "gender");
wireGroup("purposePill", "purpose");

document.querySelectorAll(".mood-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mood = btn.dataset.mood;
    document.querySelectorAll(".mood-card").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ---------------- Sliders with live value display ----------------
function wireSlider(id, valId, decimals) {
  const input = document.getElementById(id);
  const out = document.getElementById(valId);
  const render = () => (out.textContent = decimals === 0 ? input.value : parseFloat(input.value).toFixed(decimals));
  input.addEventListener("input", render);
  render();
}
wireSlider("age", "ageVal", 0);
wireSlider("avgUsage", "avgUsageVal", 1);
wireSlider("studyHours", "studyHoursVal", 1);
wireSlider("activityHours", "activityHoursVal", 1);
wireSlider("sleepHours", "sleepHoursVal", 1);

// ---------------- Theme toggle ----------------
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme");
  document.body.setAttribute("data-theme", current === "light" ? "dark" : "light");
});

// ---------------- Reset ----------------
document.getElementById("resetBtn").addEventListener("click", () => location.reload());

// ---------------- API status badge + config modal ----------------
const apiBadge = document.getElementById("apiBadge");
const apiStatusText = document.getElementById("apiStatusText");
const apiModal = document.getElementById("apiModal");
const apiUrlInput = document.getElementById("apiUrlInput");

async function checkApi() {
  apiBadge.classList.remove("ok", "bad");
  apiStatusText.textContent = "Checking API…";
  try {
    const res = await fetch(API_BASE + "/", { method: "GET" });
    if (!res.ok) throw new Error("bad status");
    apiBadge.classList.add("ok");
    apiStatusText.textContent = "API Connected";
  } catch (e) {
    apiBadge.classList.add("bad");
    apiStatusText.textContent = "API Offline";
  }
}
apiBadge.addEventListener("click", () => {
  apiUrlInput.value = API_BASE;
  apiModal.classList.add("show");
});
document.getElementById("apiCancel").addEventListener("click", () => apiModal.classList.remove("show"));
document.getElementById("apiSave").addEventListener("click", () => {
  const v = apiUrlInput.value.trim().replace(/\/+$/, "");
  if (v) API_BASE = v;
  apiModal.classList.remove("show");
  checkApi();
});
checkApi();

// ---------------- Gauge ----------------
const RADIUS = 94;
const CIRC = 2 * Math.PI * RADIUS;
const gaugeArc = document.getElementById("gaugeArc");
const gaugeCenter = document.getElementById("gaugeCenter");

function paintGauge(scoreOn10) {
  const pct = Math.max(0, Math.min(1, scoreOn10 / 10));
  const dash = CIRC * pct;
  gaugeArc.setAttribute("stroke-dasharray", `${dash} ${CIRC}`);
  const color =
    scoreOn10 >= 7 ? "var(--success)" :
    scoreOn10 >= 5 ? "var(--primary)" :
    scoreOn10 >= 3.5 ? "var(--warning)" : "var(--danger)";
  gaugeArc.style.stroke = color;
  gaugeCenter.innerHTML = `
    <div class="gauge-score" style="color:${color}">${(scoreOn10 * 10).toFixed(1)}</div>
    <div class="gauge-label">WELLNESS SCORE</div>
  `;
}

// ---------------- Client-side analysis / recommendation text ----------------
// (The API only returns a numeric score — these two boxes turn that number
//  plus the submitted inputs into plain-language context.)
function buildAnalysis(payload, score) {
  const bits = [];
  if (payload.Avg_Daily_Usage_Hours >= 6) bits.push(`high daily usage on ${payload.Most_Used_Platform} (${payload.Avg_Daily_Usage_Hours}h/day)`);
  if (payload.Daily_Unlocks >= 100) bits.push(`elevated phone unlocks (${payload.Daily_Unlocks}/day)`);
  if (payload.Sleep_Hours_Per_Night < 6) bits.push(`low sleep (${payload.Sleep_Hours_Per_Night}h/night)`);
  if (payload.Physical_Activity_Hours < 1) bits.push("minimal physical activity");
  if (payload.Stress_Level === "High" || payload.Stress_Level === "Very High") bits.push(`self-reported ${payload.Stress_Level.toLowerCase()} baseline stress`);

  const risk = score >= 7 ? "Low" : score >= 5 ? "Moderate" : score >= 3.5 ? "Elevated" : "High";
  let text = `${risk} risk detected.`;
  text += bits.length
    ? ` ${bits.slice(0, 2).join(" combined with ")} correlates with lower predicted wellness.`
    : " Current inputs are broadly within healthy ranges.";
  return text;
}
function buildRecommendation(payload, score) {
  if (score >= 7) return "Keep current habits steady — consistent sleep and activity levels are supporting your wellness score.";
  const recs = [];
  if (payload.Sleep_Hours_Per_Night < 7) recs.push("aim for 7–8 hours of sleep");
  if (payload.Avg_Daily_Usage_Hours >= 5) recs.push("set a digital sunset 60 minutes before bed");
  if (payload.Daily_Unlocks >= 100) recs.push("reduce notification frequency to lower unlock compulsion");
  if (payload.Physical_Activity_Hours < 1.5) recs.push("add 20–30 minutes of daily movement");
  if (!recs.length) recs.push("maintain your current balance of study, activity and screen time");
  return "Try to " + recs.slice(0, 2).join(", and ") + ".";
}
function renderResultBoxes(payload, score) {
  document.getElementById("resultBoxes").innerHTML = `
    <div class="info-box analysis">
      <div class="box-title">⚠ Analysis</div>
      ${buildAnalysis(payload, score)}
    </div>
    <div class="info-box rec">
      <div class="box-title">📍 Recommendation</div>
      ${buildRecommendation(payload, score)}
    </div>
  `;
}

// ---------------- Collect form payload ----------------
function collectPayload() {
  return {
    Age: parseInt(document.getElementById("age").value, 10),
    Gender: state.gender,
    Country: countrySel.value,
    Academic_Level: document.getElementById("academicLevel").value,
    Most_Used_Platform: state.platform,
    Purpose_Of_Use: state.purpose,
    Avg_Daily_Usage_Hours: parseFloat(document.getElementById("avgUsage").value),
    Daily_Unlocks: parseInt(document.getElementById("dailyUnlocks").value || "0", 10),
    Study_Hours: parseFloat(document.getElementById("studyHours").value),
    Physical_Activity_Hours: parseFloat(document.getElementById("activityHours").value),
    Sleep_Hours_Per_Night: parseFloat(document.getElementById("sleepHours").value),
    Stress_Level: state.mood,
  };
}

// ---------------- Submit ----------------
const calcBtn = document.getElementById("calcBtn");
const calcBtnText = document.getElementById("calcBtnText");

calcBtn.addEventListener("click", async () => {
  const payload = collectPayload();

  calcBtn.classList.add("loading");
  calcBtn.disabled = true;
  calcBtnText.textContent = "Calculating…";
  document.getElementById("resultBoxes").innerHTML = "";

  try {
    const res = await fetch(API_BASE + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API returned ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const score = data.predict_mentel_health_score;
    paintGauge(score);
    renderResultBoxes(payload, score);
    apiBadge.classList.remove("bad");
    apiBadge.classList.add("ok");
    apiStatusText.textContent = "API Connected";
  } catch (err) {
    document.getElementById("resultBoxes").innerHTML = `
      <div class="error-banner">
        <strong>Couldn't reach the prediction API.</strong><br>
        ${err.message}<br><br>
        Check that <code>uvicorn main:app --reload</code> is running and that the API URL
        (click the status badge, top right) points to it.
      </div>`;
  } finally {
    calcBtn.classList.remove("loading");
    calcBtn.disabled = false;
    calcBtnText.textContent = "Calculate My Score";
  }
});
