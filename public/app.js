"use strict";

const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");
const motivationLine = document.getElementById("motivationLine");
const logoutButton = document.getElementById("logoutButton");
const doctorName = document.getElementById("doctorName");
const symptomText = document.getElementById("symptomText");
const symptomChoices = document.getElementById("symptomChoices");
const form = document.getElementById("predictionForm");
const result = document.getElementById("result");
const clearSymptoms = document.getElementById("clearSymptoms");
const resetForm = document.getElementById("resetForm");
const resultState = document.getElementById("resultState");
const modelVersion = document.getElementById("modelVersion");
const workspaceDate = document.getElementById("workspaceDate");
const patientNameOptions = document.getElementById("patientNameOptions");
const patientRecordForm = document.getElementById("patientRecordForm");
const medicineForm = document.getElementById("medicineForm");
const dailyRecordForm = document.getElementById("dailyRecordForm");
const followUpForm = document.getElementById("followUpForm");
const doctorWorkspace = document.querySelector(".doctor-workspace");
const patientRecordList = document.getElementById("patientRecordList");
const medicineList = document.getElementById("medicineList");
const dailyRecordList = document.getElementById("dailyRecordList");
const followUpList = document.getElementById("followUpList");
const patientCount = document.getElementById("patientCount");
const medicineAverage = document.getElementById("medicineAverage");
const dailyRecordCount = document.getElementById("dailyRecordCount");
const followUpCount = document.getElementById("followUpCount");
const commandAssessment = document.getElementById("commandAssessment");
const commandRecords = document.getElementById("commandRecords");
const commandCritical = document.getElementById("commandCritical");
const commandShift = document.getElementById("commandShift");
const opdQueueCount = document.getElementById("opdQueueCount");
const criticalWatchCount = document.getElementById("criticalWatchCount");
const dueFollowUpCount = document.getElementById("dueFollowUpCount");
const handoverCount = document.getElementById("handoverCount");
const lastSavedAt = document.getElementById("lastSavedAt");
const patientSearch = document.getElementById("patientSearch");
const patientSearchResults = document.getElementById("patientSearchResults");
const criticalForm = document.getElementById("criticalForm");
const criticalList = document.getElementById("criticalList");
const handoverForm = document.getElementById("handoverForm");
const handoverList = document.getElementById("handoverList");
const dailyBriefing = document.getElementById("dailyBriefing");
const printBriefing = document.getElementById("printBriefing");
const exportJson = document.getElementById("exportJson");
const exportCsv = document.getElementById("exportCsv");
const printPatientName = document.getElementById("printPatientName");
const previewPatientSlip = document.getElementById("previewPatientSlip");
const printPatientSlip = document.getElementById("printPatientSlip");
const patientPrintPreview = document.getElementById("patientPrintPreview");
const patientPrintArea = document.getElementById("patientPrintArea");
const hospitalExtensions = document.querySelector(".hospital-extensions");
const doctorWorkspaceStorageKey = "disease-prediction-doctor-workspace-v1";

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

let doctorData = loadDoctorData();
const doctorMotivations = [
  "Your care matters, and your life matters too.",
  "One steady breath. One patient at a time. You are doing meaningful work.",
  "You bring calm to hard moments. Please keep some calm for yourself too.",
  "Your presence has value beyond your profession.",
  "A short pause is not weakness. It is maintenance for a life that matters.",
  "डॉक्टर, आपकी मेहनत कई घरों में उम्मीद बनती है।",
  "आप दूसरों की जान बचाते हैं; अपनी सांसों की कीमत भी याद रखें।",
  "थोड़ा ठहरना भी सेवा का हिस्सा है।",
  "आपकी मुस्कान और आपका जीवन, दोनों बहुत कीमती हैं।",
  "आज बस एक कदम। शांति से, सम्मान से, अपने लिए भी।"
];
let motivationIndex = 0;

function rotateMotivation() {
  if (!motivationLine) return;
  motivationIndex = (motivationIndex + 1) % doctorMotivations.length;
  motivationLine.textContent = doctorMotivations[motivationIndex];
}

function setLoginMessage(message, success = false) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.classList.toggle("success", success);
}

function showLogin() {
  authScreen?.classList.remove("hidden");
  appShell?.classList.add("hidden");
  if (loginPassword) loginPassword.value = "";
  setLoginMessage("");
  window.setTimeout(() => loginUsername?.focus(), 50);
}

function showApp(doctor) {
  authScreen?.classList.add("hidden");
  appShell?.classList.remove("hidden");
  if (doctorName) {
    doctorName.textContent = doctor?.name || "Doctor";
  }
}

async function authRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

async function initializeDoctorSession() {
  try {
    const data = await authRequest("/auth/me", { method: "GET", headers: {} });
    showApp(data.doctor);
    await loadSymptoms();
    renderDoctorWorkspace();
  } catch (error) {
    showLogin();
  }
}

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

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function cleanValue(id) {
  const element = document.getElementById(id);
  return String(element?.value || "").trim();
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function shortDate(value) {
  if (!value) return "Today";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function loadDoctorData() {
  const fallback = {
    patients: [],
    medicines: [],
    dailyRecords: [],
    followUps: [],
    criticalCases: [],
    handovers: []
  };
  try {
    const saved = JSON.parse(localStorage.getItem(doctorWorkspaceStorageKey) || "{}");
    return {
      patients: Array.isArray(saved.patients) ? saved.patients : [],
      medicines: Array.isArray(saved.medicines) ? saved.medicines : [],
      dailyRecords: Array.isArray(saved.dailyRecords) ? saved.dailyRecords : [],
      followUps: Array.isArray(saved.followUps) ? saved.followUps : [],
      criticalCases: Array.isArray(saved.criticalCases) ? saved.criticalCases : [],
      handovers: Array.isArray(saved.handovers) ? saved.handovers : []
    };
  } catch (error) {
    return fallback;
  }
}

function saveDoctorData() {
  localStorage.setItem(doctorWorkspaceStorageKey, JSON.stringify(doctorData));
}

function collectionEntries() {
  return [
    ["Patient Record", doctorData.patients],
    ["Medicine", doctorData.medicines],
    ["Daily Record", doctorData.dailyRecords],
    ["Follow-up", doctorData.followUps],
    ["Critical Watch", doctorData.criticalCases],
    ["Shift Handover", doctorData.handovers]
  ];
}

function unifiedRecords() {
  return collectionEntries().flatMap(([type, records]) => records.map(record => ({ type, ...record })));
}

function recordsByNewest(records) {
  return [...records].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function dueFollowUps() {
  const todayEnd = new Date(todayInputValue());
  todayEnd.setHours(23, 59, 59, 999);
  return doctorData.followUps.filter(record => {
    if (!record.date) return false;
    const date = new Date(record.date);
    return !Number.isNaN(date.getTime()) && date <= todayEnd;
  });
}

function updateLastSaved() {
  if (!lastSavedAt) return;
  const newest = recordsByNewest(unifiedRecords())[0];
  lastSavedAt.textContent = newest ? `Last saved ${timeLabel(newest.createdAt)}` : "Local records";
}

function makeRecordId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function latest(items) {
  return [...items]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
}

function renderEmptyList(message) {
  return `<div class="empty-list">${escapeHtml(message)}</div>`;
}

function badgeClass(value) {
  return slug(value) || "routine";
}

function renderRecordList(container, items, emptyMessage, renderer) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = renderEmptyList(emptyMessage);
    return;
  }

  container.innerHTML = latest(items).map(renderer).join("");
}

function allPatientNames() {
  return [...new Set([
    ...doctorData.patients.map(record => record.name),
    ...doctorData.medicines.map(record => record.name),
    ...doctorData.dailyRecords.map(record => record.name),
    ...doctorData.followUps.map(record => record.name),
    ...doctorData.criticalCases.map(record => record.name)
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function updatePatientOptions() {
  if (!patientNameOptions) return;
  patientNameOptions.innerHTML = allPatientNames()
    .map(name => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function calculateMedicineAverage() {
  if (!doctorData.medicines.length) return 0;
  const total = doctorData.medicines.reduce((sum, record) => sum + record.percent, 0);
  return Math.round(total / doctorData.medicines.length);
}

function recordSearchText(record) {
  return Object.values(record)
    .filter(value => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();
}

function recordSubtitle(record) {
  if (record.type === "Patient Record") return record.concern || record.status || "Patient entry";
  if (record.type === "Medicine") return `${record.plan || "Medicine plan"} - ${record.percent || 0}% complete`;
  if (record.type === "Daily Record") return record.note || `BP ${record.bp || "-"}, Pulse ${record.pulse || "-"}`;
  if (record.type === "Follow-up") return `${record.action || "Follow-up"} - ${shortDate(record.date)}`;
  if (record.type === "Critical Watch") return `${record.issue || "Critical note"} - ${record.location || "Location not set"}`;
  if (record.type === "Shift Handover") return `${record.shift || "Shift"} - ${record.unit || "Unit not set"}`;
  return "Record";
}

function renderSearchResults() {
  if (!patientSearchResults) return;
  const query = String(patientSearch?.value || "").trim().toLowerCase();
  const records = recordsByNewest(unifiedRecords());
  const filtered = query
    ? records.filter(record => recordSearchText(record).includes(query))
    : records.slice(0, 6);

  if (!filtered.length) {
    patientSearchResults.innerHTML = renderEmptyList(query ? "No matching records found." : "No activity yet. Add records to build a timeline.");
    return;
  }

  patientSearchResults.innerHTML = filtered.slice(0, 8).map(record => `
    <article class="record-item search-hit">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.name || record.unit || record.type)}</strong>
          <span class="record-meta">${escapeHtml(recordSubtitle(record))}</span>
        </div>
        <span class="status-badge routine">${escapeHtml(record.type)}</span>
      </div>
      <span class="record-meta">${escapeHtml(timeLabel(record.createdAt))}</span>
    </article>
  `).join("");
}

function renderDailyBriefing() {
  if (!dailyBriefing) return;
  const due = dueFollowUps().length;
  const completion = calculateMedicineAverage();
  const latestCritical = doctorData.criticalCases[0];
  const latestHandover = doctorData.handovers[0];

  dailyBriefing.innerHTML = `
    <div class="brief-line">
      <strong>Total registered patient records</strong>
      <span>${doctorData.patients.length}</span>
    </div>
    <div class="brief-line">
      <strong>Critical watchlist load</strong>
      <span>${doctorData.criticalCases.length} active</span>
    </div>
    <div class="brief-line">
      <strong>Follow-ups due today or overdue</strong>
      <span>${due}</span>
    </div>
    <div class="brief-line">
      <strong>Average medicine completion</strong>
      <span>${completion}%</span>
    </div>
    <div class="brief-line">
      <strong>Latest critical concern</strong>
      <span>${escapeHtml(latestCritical ? `${latestCritical.name}: ${latestCritical.issue}` : "No active critical case")}</span>
    </div>
    <div class="brief-line">
      <strong>Latest handover</strong>
      <span>${escapeHtml(latestHandover ? `${latestHandover.shift} - ${latestHandover.nextAction || latestHandover.note}` : "No handover saved")}</span>
    </div>
  `;
}

function normaliseLookup(value) {
  return String(value || "").trim().toLowerCase();
}

function matchingPatientName(value) {
  const query = normaliseLookup(value);
  if (!query) return "";

  const names = allPatientNames();
  return names.find(name => normaliseLookup(name) === query)
    || names.find(name => normaliseLookup(name).startsWith(query))
    || names.find(name => normaliseLookup(name).includes(query))
    || String(value || "").trim();
}

function recordsForPatient(records, patientName) {
  const target = normaliseLookup(patientName);
  if (!target) return [];
  return recordsByNewest(records.filter(record => normaliseLookup(record.name) === target));
}

function patientPrintBundle(value) {
  const name = matchingPatientName(value);
  return {
    name,
    patient: recordsForPatient(doctorData.patients, name)[0],
    medicines: recordsForPatient(doctorData.medicines, name),
    dailyRecords: recordsForPatient(doctorData.dailyRecords, name),
    followUps: recordsForPatient(doctorData.followUps, name),
    criticalCases: recordsForPatient(doctorData.criticalCases, name)
  };
}

function hasPatientPrintData(bundle) {
  return Boolean(
    bundle.patient
    || bundle.medicines.length
    || bundle.dailyRecords.length
    || bundle.followUps.length
    || bundle.criticalCases.length
  );
}

function calculatePatientMedicineAverage(records) {
  if (!records.length) return null;
  const total = records.reduce((sum, record) => sum + (Number(record.percent) || 0), 0);
  return Math.round(total / records.length);
}

function renderSlipField(label, value) {
  return `
    <div class="slip-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "Not recorded")}</strong>
    </div>
  `;
}

function renderSlipRows(records, emptyMessage, renderer) {
  if (!records.length) {
    return `<p class="slip-empty">${escapeHtml(emptyMessage)}</p>`;
  }
  return `<div class="slip-list">${records.slice(0, 5).map(renderer).join("")}</div>`;
}

function buildPatientSlipHtml(value) {
  const bundle = patientPrintBundle(value);

  if (!bundle.name) {
    return {
      ok: false,
      html: "Select a patient to generate a printable clinical slip."
    };
  }

  if (!hasPatientPrintData(bundle)) {
    return {
      ok: false,
      html: `No saved records found for ${escapeHtml(bundle.name)}.`
    };
  }

  const patient = bundle.patient || {};
  const latestDaily = bundle.dailyRecords[0] || {};
  const latestCritical = bundle.criticalCases[0];
  const medicineAverageForPatient = calculatePatientMedicineAverage(bundle.medicines);
  const status = patient.status || latestCritical?.priority || "Active";
  const concern = patient.concern || latestCritical?.issue || latestDaily.note || "Not recorded";
  const generatedAt = new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return {
    ok: true,
    html: `
      <div class="patient-slip-header">
        <div>
          <p class="eyebrow">Disease Prediction Clinic</p>
          <h3>Patient Clinical Slip</h3>
          <p class="slip-subtitle">Generated ${escapeHtml(generatedAt)} by ${escapeHtml(doctorName?.textContent || "Doctor")}</p>
        </div>
        <span class="slip-stamp">Patient Copy</span>
      </div>

      <div class="slip-grid">
        ${renderSlipField("Patient name", bundle.name)}
        ${renderSlipField("Age", patient.age ? `${patient.age} yrs` : "")}
        ${renderSlipField("Current status", status)}
        ${renderSlipField("Primary concern", concern)}
        ${renderSlipField("Medicine completion", medicineAverageForPatient === null ? "" : `${medicineAverageForPatient}% average`)}
        ${renderSlipField("Last updated", timeLabel(patient.createdAt || latestDaily.createdAt || latestCritical?.createdAt))}
      </div>

      <section class="slip-section">
        <div class="slip-section-head">
          <h4>Latest Vitals And Doctor Note</h4>
          <span>${escapeHtml(latestDaily.createdAt ? timeLabel(latestDaily.createdAt) : "No vitals recorded")}</span>
        </div>
        <div class="slip-grid compact-slip">
          ${renderSlipField("Blood pressure", latestDaily.bp)}
          ${renderSlipField("Pulse", latestDaily.pulse)}
          ${renderSlipField("Temperature", latestDaily.temp)}
        </div>
        <p class="slip-note">${escapeHtml(latestDaily.note || "No doctor note added yet.")}</p>
      </section>

      <section class="slip-section">
        <div class="slip-section-head">
          <h4>Medicine Completion</h4>
          <span>${bundle.medicines.length} updates</span>
        </div>
        ${renderSlipRows(bundle.medicines, "No medicine completion updates.", record => `
          <div class="slip-row">
            <div>
              <strong>${escapeHtml(record.plan || "Medicine plan")}</strong>
              <span>${escapeHtml(record.completed)}/${escapeHtml(record.total)} doses - ${escapeHtml(record.status)}</span>
            </div>
            <b>${escapeHtml(record.percent)}%</b>
          </div>
        `)}
      </section>

      <section class="slip-section">
        <div class="slip-section-head">
          <h4>Follow-up Plan</h4>
          <span>${bundle.followUps.length} tasks</span>
        </div>
        ${renderSlipRows(bundle.followUps, "No follow-up tasks scheduled.", record => `
          <div class="slip-row">
            <div>
              <strong>${escapeHtml(record.action || "Follow-up action")}</strong>
              <span>Next: ${escapeHtml(shortDate(record.date))}</span>
            </div>
            <b>${escapeHtml(record.priority)}</b>
          </div>
        `)}
      </section>

      <section class="slip-section ${latestCritical ? "slip-alert" : ""}">
        <div class="slip-section-head">
          <h4>Critical Watch Notes</h4>
          <span>${bundle.criticalCases.length} active notes</span>
        </div>
        ${renderSlipRows(bundle.criticalCases, "No critical watch notes for this patient.", record => `
          <div class="slip-row">
            <div>
              <strong>${escapeHtml(record.issue || "Critical concern")}</strong>
              <span>${escapeHtml(record.location || "Location not set")} - ${escapeHtml(record.action || "No action added")}</span>
            </div>
            <b>${escapeHtml(record.priority)}</b>
          </div>
        `)}
      </section>

      <p class="slip-disclaimer">
        Educational triage support only. This printout is not a final diagnosis and must be reviewed by a licensed clinician.
      </p>
    `
  };
}

function renderPatientPrintPreview(value) {
  if (!patientPrintPreview) return false;
  const slip = buildPatientSlipHtml(value);
  patientPrintPreview.className = slip.ok ? "patient-slip" : "patient-slip empty-list";
  patientPrintPreview.innerHTML = slip.html;
  return slip.ok;
}

function clearPatientPrintMode() {
  document.body.classList.remove("print-patient-mode");
  patientPrintArea?.setAttribute("aria-hidden", "true");
}

function printPatientSlipFor(value) {
  const slip = buildPatientSlipHtml(value);
  if (!slip.ok) {
    renderPatientPrintPreview(value);
    window.alert("Please select a patient with saved records before printing.");
    return;
  }

  renderPatientPrintPreview(value);
  if (patientPrintArea) {
    patientPrintArea.innerHTML = `<div class="patient-slip">${slip.html}</div>`;
    patientPrintArea.removeAttribute("aria-hidden");
  }

  document.body.classList.add("print-patient-mode");
  window.requestAnimationFrame(() => {
    window.print();
    window.setTimeout(clearPatientPrintMode, 3000);
  });
}

function renderHospitalExtensions() {
  if (opdQueueCount) opdQueueCount.textContent = doctorData.patients.length;
  if (criticalWatchCount) criticalWatchCount.textContent = doctorData.criticalCases.length;
  if (dueFollowUpCount) dueFollowUpCount.textContent = dueFollowUps().length;
  if (handoverCount) handoverCount.textContent = doctorData.handovers.length;
  if (commandRecords) commandRecords.textContent = `${doctorData.patients.length} Patients`;
  if (commandCritical) commandCritical.textContent = `${doctorData.criticalCases.length} Cases`;
  if (commandShift) commandShift.textContent = `${doctorData.handovers.length} Notes`;
  if (commandAssessment) commandAssessment.textContent = "AI Triage";

  renderRecordList(criticalList, doctorData.criticalCases, "No critical watchlist cases.", record => `
    <article class="record-item critical">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.name)}</strong>
          <span class="record-meta">${escapeHtml(record.location || "Location not set")} - ${escapeHtml(record.issue || "No issue added")}</span>
        </div>
        <span class="status-badge ${badgeClass(record.priority)}">${escapeHtml(record.priority)}</span>
      </div>
      <p class="record-note">${escapeHtml(record.action || "No action added")}</p>
      <div class="record-actions">
        <span class="record-meta">${escapeHtml(timeLabel(record.createdAt))}</span>
        <button class="ghost small" type="button" data-delete="criticalCases" data-id="${escapeHtml(record.id)}">Remove</button>
      </div>
    </article>
  `);

  renderRecordList(handoverList, doctorData.handovers, "No shift handover notes saved.", record => `
    <article class="record-item">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.shift)} Shift</strong>
          <span class="record-meta">${escapeHtml(record.unit || "Unit not set")}</span>
        </div>
        <span class="status-badge routine">${escapeHtml(shortDate(record.createdAt))}</span>
      </div>
      <p class="record-note">${escapeHtml(record.note || "No handover note added")}</p>
      <div class="record-actions">
        <span class="record-meta">${escapeHtml(record.nextAction || "No next action added")}</span>
        <button class="ghost small" type="button" data-delete="handovers" data-id="${escapeHtml(record.id)}">Remove</button>
      </div>
    </article>
  `);

  renderSearchResults();
  renderDailyBriefing();
  renderPatientPrintPreview(printPatientName?.value || "");
  updateLastSaved();
}

function exportPayload() {
  return {
    exportedAt: new Date().toISOString(),
    system: "Disease Prediction Clinical Operations Console",
    summary: {
      patientRecords: doctorData.patients.length,
      medicineAverage: calculateMedicineAverage(),
      dailyRecords: doctorData.dailyRecords.length,
      followUps: doctorData.followUps.length,
      dueFollowUps: dueFollowUps().length,
      criticalCases: doctorData.criticalCases.length,
      handovers: doctorData.handovers.length
    },
    records: doctorData
  };
}

function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvValue(value) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

function exportRecordsAsCsv() {
  const rows = unifiedRecords().map(record => ({
    type: record.type,
    name: record.name || "",
    status: record.status || record.priority || record.shift || "",
    detail: recordSubtitle(record),
    createdAt: record.createdAt || ""
  }));
  const header = ["type", "name", "status", "detail", "createdAt"];
  const csv = [
    header.join(","),
    ...rows.map(row => header.map(key => csvValue(row[key])).join(","))
  ].join("\n");
  downloadFile(`clinical-records-${todayInputValue()}.csv`, "text/csv;charset=utf-8", csv);
}

function exportRecordsAsJson() {
  downloadFile(
    `clinical-records-${todayInputValue()}.json`,
    "application/json;charset=utf-8",
    JSON.stringify(exportPayload(), null, 2)
  );
}

function renderDoctorWorkspace() {
  if (!doctorWorkspace) return;

  if (workspaceDate) {
    workspaceDate.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  if (patientCount) patientCount.textContent = doctorData.patients.length;
  if (medicineAverage) medicineAverage.textContent = `${calculateMedicineAverage()}%`;
  if (dailyRecordCount) dailyRecordCount.textContent = doctorData.dailyRecords.length;
  if (followUpCount) followUpCount.textContent = doctorData.followUps.length;

  updatePatientOptions();

  renderRecordList(patientRecordList, doctorData.patients, "No patient records saved.", record => `
    <article class="record-item">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.name)}</strong>
          <span class="record-meta">${escapeHtml(record.age ? `${record.age} yrs` : "Age not set")} - ${escapeHtml(record.concern || "No concern added")}</span>
        </div>
        <span class="status-badge ${badgeClass(record.status)}">${escapeHtml(record.status)}</span>
      </div>
      <div class="record-actions">
        <span class="record-meta">${escapeHtml(timeLabel(record.createdAt))}</span>
        <div class="record-action-buttons">
          <button class="ghost small" type="button" data-print-patient="${escapeHtml(record.name)}">Print</button>
          <button class="ghost small" type="button" data-delete="patients" data-id="${escapeHtml(record.id)}">Remove</button>
        </div>
      </div>
    </article>
  `);

  renderRecordList(medicineList, doctorData.medicines, "No medicine completion updates.", record => `
    <article class="record-item">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.name)}</strong>
          <span class="record-meta">${escapeHtml(record.plan)}</span>
        </div>
        <span class="status-badge ${badgeClass(record.status)}">${escapeHtml(record.percent)}%</span>
      </div>
      <div class="progress-line" aria-label="Medicine completion ${record.percent}%"><span style="width:${record.percent}%"></span></div>
      <div class="record-actions">
        <span class="record-meta">${escapeHtml(record.completed)}/${escapeHtml(record.total)} doses - ${escapeHtml(record.status)}</span>
        <button class="ghost small" type="button" data-delete="medicines" data-id="${escapeHtml(record.id)}">Remove</button>
      </div>
    </article>
  `);

  renderRecordList(dailyRecordList, doctorData.dailyRecords, "No daily clinical records saved.", record => `
    <article class="record-item">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.name)}</strong>
          <span class="record-meta">BP ${escapeHtml(record.bp || "-")} - Pulse ${escapeHtml(record.pulse || "-")} - Temp ${escapeHtml(record.temp || "-")}</span>
        </div>
        <span class="status-badge routine">${escapeHtml(shortDate(record.createdAt))}</span>
      </div>
      <p class="record-note">${escapeHtml(record.note || "No note added")}</p>
      <div class="record-actions">
        <span class="record-meta">${escapeHtml(timeLabel(record.createdAt))}</span>
        <button class="ghost small" type="button" data-delete="dailyRecords" data-id="${escapeHtml(record.id)}">Remove</button>
      </div>
    </article>
  `);

  renderRecordList(followUpList, doctorData.followUps, "No follow-up tasks scheduled.", record => `
    <article class="record-item">
      <div class="record-top">
        <div class="record-title">
          <strong>${escapeHtml(record.name)}</strong>
          <span class="record-meta">${escapeHtml(record.action || "No action added")}</span>
        </div>
        <span class="status-badge ${badgeClass(record.priority)}">${escapeHtml(record.priority)}</span>
      </div>
      <div class="record-actions">
        <span class="record-meta">Next: ${escapeHtml(shortDate(record.date))}</span>
        <button class="ghost small" type="button" data-delete="followUps" data-id="${escapeHtml(record.id)}">Remove</button>
      </div>
    </article>
  `);

  renderHospitalExtensions();
}

function requireClientName(name) {
  if (name) return true;
  window.alert("Please enter the client name first.");
  return false;
}

function renderEmpty() {
  setResultState("Ready");
  result.className = "result empty-state";
  result.innerHTML = `
    <div class="empty-visual">
      <span class="empty-line strong"></span>
      <span class="empty-line"></span>
      <span class="empty-meter"><span></span></span>
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
          <p class="muted">${escapeHtml(item.category)}</p>
        </div>
        <div class="score">${item.score}<small>score</small></div>
      </div>
      <div class="bar" aria-label="Score ${item.score} out of 100"><span style="width:${Math.max(4, item.score)}%"></span></div>
      <div class="confidence-pill">${escapeHtml(item.confidence)} confidence</div>
      <p>${escapeHtml(item.careAdvice)}</p>
      <div class="tags">
        ${item.matchedSymptoms.map(symptom => `<span class="tag">${escapeHtml(titleCase(symptom))}</span>`).join("")}
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
      <div class="metric"><span>Recognised symptoms</span><strong>${data.input.recognisedSymptoms.length}</strong></div>
      <div class="metric"><span>Top score</span><strong>${topScore}</strong></div>
      <div class="metric"><span>Condition matches</span><strong>${data.predictions.length}</strong></div>
    </section>

    <section class="urgency ${escapeHtml(data.urgency.level)}">
      <span class="label">${escapeHtml(titleCase(data.urgency.level))}</span>
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
    const response = await fetch("/disease-prediction/symptoms", { credentials: "include" });
    if (response.status === 401) {
      showLogin();
      return;
    }
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
      <span class="empty-line strong"></span>
      <span class="empty-line"></span>
      <span class="empty-meter"><span></span></span>
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (response.status === 401) {
      showLogin();
      return;
    }
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

loginForm?.addEventListener("submit", async event => {
  event.preventDefault();
  setLoginMessage("Signing in...");

  try {
    const data = await authRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value
      })
    });

    setLoginMessage("Signed in", true);
    showApp(data.doctor);
    await loadSymptoms();
    renderDoctorWorkspace();
  } catch (error) {
    setLoginMessage(error.message || "Could not sign in");
  }
});

logoutButton?.addEventListener("click", async () => {
  try {
    await authRequest("/auth/logout", { method: "POST", body: "{}" });
  } catch (error) {
    // The local UI can still return to the login page if the cookie is already expired.
  }

  renderEmpty();
  showLogin();
});

patientRecordForm?.addEventListener("submit", event => {
  event.preventDefault();
  const name = cleanValue("patientName");
  if (!requireClientName(name)) return;

  doctorData.patients.unshift({
    id: makeRecordId(),
    name,
    age: cleanValue("patientAge"),
    status: cleanValue("patientStatus") || "Waiting",
    concern: cleanValue("patientConcern"),
    createdAt: new Date().toISOString()
  });

  patientRecordForm.reset();
  saveDoctorData();
  renderDoctorWorkspace();
});

medicineForm?.addEventListener("submit", event => {
  event.preventDefault();
  const name = cleanValue("medicinePatient");
  if (!requireClientName(name)) return;

  const total = Math.max(1, Number(cleanValue("dosesTotal")) || 1);
  const completed = Math.min(total, Math.max(0, Number(cleanValue("dosesCompleted")) || 0));
  const percent = Math.round((completed / total) * 100);
  const status = percent >= 100 ? "Complete" : percent >= 50 ? "Partial" : "Pending";

  doctorData.medicines.unshift({
    id: makeRecordId(),
    name,
    plan: cleanValue("medicinePlan") || "Medicine plan not added",
    completed,
    total,
    percent,
    status,
    createdAt: new Date().toISOString()
  });

  medicineForm.reset();
  saveDoctorData();
  renderDoctorWorkspace();
});

dailyRecordForm?.addEventListener("submit", event => {
  event.preventDefault();
  const name = cleanValue("dailyPatient");
  if (!requireClientName(name)) return;

  doctorData.dailyRecords.unshift({
    id: makeRecordId(),
    name,
    bp: cleanValue("bloodPressure"),
    pulse: cleanValue("pulseRate"),
    temp: cleanValue("temperature"),
    note: cleanValue("doctorNote"),
    createdAt: new Date().toISOString()
  });

  dailyRecordForm.reset();
  saveDoctorData();
  renderDoctorWorkspace();
});

followUpForm?.addEventListener("submit", event => {
  event.preventDefault();
  const name = cleanValue("followPatient");
  if (!requireClientName(name)) return;

  doctorData.followUps.unshift({
    id: makeRecordId(),
    name,
    date: cleanValue("followDate"),
    priority: cleanValue("followPriority") || "Routine",
    action: cleanValue("followAction"),
    createdAt: new Date().toISOString()
  });

  followUpForm.reset();
  document.getElementById("followDate").value = todayInputValue();
  saveDoctorData();
  renderDoctorWorkspace();
});

criticalForm?.addEventListener("submit", event => {
  event.preventDefault();
  const name = cleanValue("criticalPatient");
  if (!requireClientName(name)) return;

  doctorData.criticalCases.unshift({
    id: makeRecordId(),
    name,
    location: cleanValue("criticalLocation"),
    priority: cleanValue("criticalPriority") || "High",
    issue: cleanValue("criticalIssue"),
    action: cleanValue("criticalAction"),
    createdAt: new Date().toISOString()
  });

  criticalForm.reset();
  saveDoctorData();
  renderDoctorWorkspace();
});

handoverForm?.addEventListener("submit", event => {
  event.preventDefault();

  doctorData.handovers.unshift({
    id: makeRecordId(),
    shift: cleanValue("handoverShift") || "Morning",
    unit: cleanValue("handoverUnit"),
    note: cleanValue("handoverNote"),
    nextAction: cleanValue("handoverNext"),
    createdAt: new Date().toISOString()
  });

  handoverForm.reset();
  saveDoctorData();
  renderDoctorWorkspace();
});

patientSearch?.addEventListener("input", renderSearchResults);
printPatientName?.addEventListener("input", () => renderPatientPrintPreview(printPatientName.value));
previewPatientSlip?.addEventListener("click", () => renderPatientPrintPreview(printPatientName?.value || ""));
printPatientSlip?.addEventListener("click", () => printPatientSlipFor(printPatientName?.value || ""));

printBriefing?.addEventListener("click", () => {
  window.print();
});

exportJson?.addEventListener("click", exportRecordsAsJson);
exportCsv?.addEventListener("click", exportRecordsAsCsv);
window.addEventListener("afterprint", clearPatientPrintMode);

function handleDeleteClick(event) {
  const printButton = event.target.closest("[data-print-patient]");
  if (printButton) {
    const patientName = printButton.dataset.printPatient || "";
    if (printPatientName) printPatientName.value = patientName;
    printPatientSlipFor(patientName);
    return;
  }

  const button = event.target.closest("[data-delete]");
  if (!button) return;

  const collection = button.dataset.delete;
  const id = button.dataset.id;
  if (!Array.isArray(doctorData[collection])) return;

  doctorData[collection] = doctorData[collection].filter(record => record.id !== id);
  saveDoctorData();
  renderDoctorWorkspace();
}

doctorWorkspace?.addEventListener("click", handleDeleteClick);
hospitalExtensions?.addEventListener("click", handleDeleteClick);

const followDate = document.getElementById("followDate");
if (followDate && !followDate.value) {
  followDate.value = todayInputValue();
}

if (motivationLine) {
  window.setInterval(rotateMotivation, 7000);
}

initializeDoctorSession();
