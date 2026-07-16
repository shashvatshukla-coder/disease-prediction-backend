"use strict";

const express = require("express");
const path = require("path");
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

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.get("/disease-prediction/symptoms", (req, res) => {
  res.json({
    success: true,
    modelVersion: DISEASE_MODEL_VERSION,
    disclaimer: DISEASE_PREDICTION_DISCLAIMER,
    symptoms: listKnownSymptoms()
  });
});

app.post("/disease-prediction/predict", (req, res) => {
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
    availableEndpoints: ["/", "/health", "/disease-prediction/symptoms", "/disease-prediction/predict"]
  });
});

app.listen(PORT, () => {
  console.log(`Disease prediction backend running on port ${PORT}`);
});
