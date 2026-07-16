"use strict";

const symptomText = document.getElementById("symptomText");
const symptomChoices = document.getElementById("symptomChoices");
const form = document.getElementById("predictionForm");
const result = document.getElementById("result");
const clearSymptoms = document.getElementById("clearSymptoms");
const resetForm = document.getElementById("resetForm");
const resultState = document.getElementById("resultState");
const modelVersion = document.getElementById("modelVersion");

const preferredSymptoms = [
  "fever",
  "cough",
  "body_aches",
  "fatigue",
  "headache",
  "sore_throat",
  "runny_nose",
  "shortness_of_breath",
  "chest_pain",
  "nausea",
  "vomiting",
  "diarrhea",
  "abdominal_pain",
  "rash",
  "burning_urination",
  "frequent_urination"
];

const examples = {
  flu: {
    symptoms: "fever, cough, body aches, fatigue, chills",
    age: "28",
    durationDays: "2",
    chronicConditions: ""
  },
  digestive: {
    symptoms: "nausea, vomiting, diarrhea, stomach cramps",
    age: "34",
    durationDays: "1",
    chronicConditions: ""
  },
  breathing: {
    symptoms: "fever, trouble breathing, chest pressure",
    age: "67",
    durationDays: "1",
    chronicConditions: "asthma"
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function selectedQuickSymptoms() {
  return [...document.querySelectorAll("[data-symptom]:checked")].map(input => input.value);
}

function textSymptoms() {
  return symptomText.value
    .split(/[,;\n]/)
    .map(value => value.trim())
    .filter(Boolean);
}

function numberOrUndefined(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? number : undefined;
}

function setResultState(text) {
  resultState.textContent = text;
}

function renderEmpty() {
  setResultState("Ready");
  result.className = "result empty-state";
  result.innerHTML = `
    <div class="empty-visual">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <h3>No assessment yet</h3>
    <p>Add symptoms and run a prediction to see ranked condition patterns, urgency, and care notes.</p>
  `;
}

function renderError(message) {
  setResultState("Needs input");
  result.className = "result";
  result.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function renderPrediction(data) {
  if (!data.success) {
    renderError(data.message || "Could not create a prediction.");
    return;
  }

  setResultState("Complete");

  const predictions = data.predictions.map((item, index) => `
    <article class="prediction">
      <div class="prediction-top">
        <div class="prediction-title">
          <p class="eyebrow">Rank ${index + 1}</p>
          <h3>${escapeHtml(item.condition)}</h3>
          <p class="muted">${escapeHtml(item.category)} - Confidence: ${escapeHtml(item.confidence)}</p>
        </div>
        <div class="score">${item.score}/100</div>
      </div>
      <div class="bar" aria-label="Score ${item.score} out of 100"><span style="width:${Math.max(4, item.score)}%"></span></div>
      <p>${escapeHtml(item.careAdvice)}</p>
      <div class="tags">
        ${item.matchedSymptoms.map(symptom => `<span class="tag">${escapeHtml(symptom)}</span>`).join("")}
      </div>
    </article>
  `).join("");

  const recognised = data.input.recognisedSymptoms.map(symptom => symptom.label).join(", ");
  const unknown = data.input.unknownSymptoms.length
    ? `<p class="muted">Unrecognised: ${escapeHtml(data.input.unknownSymptoms.join(", "))}</p>`
    : "";
  const topScore = data.predictions[0]?.score ?? 0;

  result.className = "result";
  result.innerHTML = `
    <section class="summary-grid">
      <div class="metric"><span>Recognised</span><strong>${data.input.recognisedSymptoms.length}</strong></div>
      <div class="metric"><span>Top score</span><strong>${topScore}</strong></div>
      <div class="metric"><span>Matches</span><strong>${data.predictions.length}</strong></div>
    </section>

    <section class="urgency ${escapeHtml(data.urgency.level)}">
      <span class="label">${escapeHtml(data.urgency.level.replace("_", " "))}</span>
      <h3>${escapeHtml(data.urgency.action)}</h3>
      <p class="muted">${escapeHtml(data.urgency.reasons.join(" "))}</p>
    </section>

    <section class="recognised">
      <h3>Recognised Symptoms</h3>
      <p class="muted">${escapeHtml(recognised || "None")}</p>
      ${unknown}
    </section>

    ${predictions || "<p class=\"muted\">No matching disease patterns found.</p>"}

    <details class="json-box">
      <summary>Raw API response</summary>
      <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    </details>
  `;
}

async function loadSymptoms() {
  try {
    const response = await fetch("/disease-prediction/symptoms");
    const data = await response.json();
    modelVersion.textContent = `v${data.modelVersion || "1.0"}`;

    const symptoms = data.symptoms
      .filter(symptom => preferredSymptoms.includes(symptom.id))
      .sort((a, b) => preferredSymptoms.indexOf(a.id) - preferredSymptoms.indexOf(b.id));

    symptomChoices.innerHTML = symptoms.map(symptom => `
      <label class="choice">
        <input data-symptom type="checkbox" value="${escapeHtml(symptom.id)}">
        ${escapeHtml(symptom.label)}
      </label>
    `).join("");
  } catch (error) {
    symptomChoices.innerHTML = "<p class=\"muted\">Could not load quick symptoms.</p>";
  }
}

function resetSelectedSymptoms() {
  symptomText.value = "";
  document.querySelectorAll("[data-symptom]").forEach(input => {
    input.checked = false;
  });
}

function fillExample(name) {
  const example = examples[name];
  if (!example) return;
  resetSelectedSymptoms();
  symptomText.value = example.symptoms;
  document.getElementById("age").value = example.age;
  document.getElementById("durationDays").value = example.durationDays;
  document.getElementById("chronicConditions").value = example.chronicConditions;
  document.getElementById("pregnant").checked = false;
  document.getElementById("immunocompromised").checked = name === "breathing";
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  setResultState("Running");
  result.className = "result empty-state";
  result.innerHTML = `
    <div class="empty-visual">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <h3>Analyzing symptoms</h3>
    <p>Ranking likely condition patterns and checking red flags.</p>
  `;

  const symptoms = [...textSymptoms(), ...selectedQuickSymptoms()];
  const body = {
    symptoms,
    age: numberOrUndefined(document.getElementById("age").value),
    durationDays: numberOrUndefined(document.getElementById("durationDays").value),
    pregnant: document.getElementById("pregnant").checked,
    immunocompromised: document.getElementById("immunocompromised").checked,
    chronicConditions: document.getElementById("chronicConditions").value
      .split(/[,;]/)
      .map(value => value.trim())
      .filter(Boolean)
  };

  try {
    const response = await fetch("/disease-prediction/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    renderPrediction(data);
  } catch (error) {
    renderError("Unable to connect to the prediction API. Make sure the server is running.");
  }
});

document.querySelectorAll("[data-example]").forEach(button => {
  button.addEventListener("click", () => fillExample(button.dataset.example));
});

clearSymptoms.addEventListener("click", resetSelectedSymptoms);

resetForm.addEventListener("click", () => {
  form.reset();
  resetSelectedSymptoms();
  renderEmpty();
});

loadSymptoms();
