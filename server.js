"use strict";

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const {
  DISEASE_MODEL_VERSION,
  DISEASE_PREDICTION_DISCLAIMER,
  listKnownSymptoms,
  predictDisease
} = require("./services/diseasePredictionModel");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const SESSION_COOKIE_NAME = "doctor_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();
const localDoctor = {
  id: "local-doctor",
  username: process.env.DOCTOR_USERNAME || "doctor",
  password: process.env.DOCTOR_PASSWORD || "doctor123",
  name: process.env.DOCTOR_NAME || "Dr. Local Clinic",
  clinic: process.env.CLINIC_NAME || "Disease Prediction Clinic",
  role: "Doctor"
};

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) return cookies;
    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function secureEquals(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function publicDoctorProfile() {
  return {
    id: localDoctor.id,
    username: localDoctor.username,
    name: localDoctor.name,
    clinic: localDoctor.clinic,
    role: localDoctor.role
  };
}

function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_DURATION_MS;
  return { token, doctor: publicDoctorProfile() };
}

function requireDoctor(req, res, next) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ success: false, message: "Doctor login required" });
    return;
  }

  req.doctor = session.doctor;
  next();
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please wait a few minutes." }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.post("/auth/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const usernameMatches = secureEquals(username || "", localDoctor.username);
  const passwordMatches = secureEquals(password || "", localDoctor.password);

  if (!usernameMatches || !passwordMatches) {
    res.status(401).json({ success: false, message: "Invalid doctor username or password" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    doctorId: localDoctor.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS
  });
  setSessionCookie(res, token);

  res.json({ success: true, doctor: publicDoctorProfile() });
});

app.get("/auth/me", (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ success: false, message: "Not signed in" });
    return;
  }

  setSessionCookie(res, session.token);
  res.json({ success: true, doctor: session.doctor });
});

app.post("/auth/logout", (req, res) => {
  const session = getSession(req);
  if (session) {
    sessions.delete(session.token);
  }
  clearSessionCookie(res);
  res.json({ success: true });
});

app.get("/disease-prediction/symptoms", requireDoctor, (req, res) => {
  res.json({
    success: true,
    modelVersion: DISEASE_MODEL_VERSION,
    disclaimer: DISEASE_PREDICTION_DISCLAIMER,
    symptoms: listKnownSymptoms()
  });
});

app.post("/disease-prediction/predict", requireDoctor, (req, res) => {
  try {
    const prediction = predictDisease(req.body || {});
    res.status(prediction.success ? 200 : 400).json(prediction);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    availableEndpoints: ["/", "/health", "/auth/login", "/auth/me", "/auth/logout", "/disease-prediction/symptoms", "/disease-prediction/predict"]
  });
});

app.listen(PORT, () => {
  console.log(`Disease prediction backend running on port ${PORT}`);
});
