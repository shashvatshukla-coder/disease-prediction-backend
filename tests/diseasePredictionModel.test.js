"use strict";

const assert = require("assert");
const {
  listKnownSymptoms,
  predictDisease
} = require("../services/diseasePredictionModel");

const fluResult = predictDisease({
  symptoms: ["high fever", "dry cough", "body aches", "fatigue", "chills"],
  age: 28,
  durationDays: 1
});

assert.strictEqual(fluResult.success, true);
assert.strictEqual(fluResult.predictions[0].id, "influenza_like_illness");
assert.ok(fluResult.predictions[0].score >= 50);

const emergencyResult = predictDisease({
  symptoms: ["fever", "trouble breathing", "chest pressure"],
  age: 72
});

assert.strictEqual(emergencyResult.success, true);
assert.strictEqual(emergencyResult.urgency.level, "emergency");
assert.ok(emergencyResult.urgency.reasons.some(reason => /breathing|chest/i.test(reason)));

const aliasResult = predictDisease({
  symptoms: "temperature, loose motions and stomach cramps"
});

assert.strictEqual(aliasResult.success, true);
assert.ok(aliasResult.input.recognisedSymptoms.some(symptom => symptom.id === "fever"));
assert.ok(aliasResult.input.recognisedSymptoms.some(symptom => symptom.id === "diarrhea"));
assert.ok(aliasResult.input.recognisedSymptoms.some(symptom => symptom.id === "abdominal_pain"));

const emptyResult = predictDisease({ symptoms: [] });
assert.strictEqual(emptyResult.success, false);
assert.ok(Array.isArray(emptyResult.knownSymptoms));

assert.ok(listKnownSymptoms().length >= 20);

console.log("Disease prediction model tests passed");
