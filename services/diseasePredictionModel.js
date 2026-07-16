"use strict";

const DISEASE_MODEL_VERSION = "1.0.0";
const DISEASE_PREDICTION_DISCLAIMER =
  "Educational symptom triage only. This is not a diagnosis and does not replace a licensed clinician.";

const MEDICAL_SOURCES = [
  {
    name: "CDC flu signs, symptoms, and emergency warning signs",
    url: "https://www.cdc.gov/flu/signs-symptoms/index.html"
  },
  {
    name: "CDC COVID-19 symptoms and emergency warning signs",
    url: "https://www.cdc.gov/covid/signs-symptoms/index.html"
  },
  {
    name: "NHS chest pain emergency guidance",
    url: "https://www.nhs.uk/symptoms/chest-pain/"
  }
];

const SYMPTOMS = {
  fever: {
    label: "Fever",
    aliases: ["fever", "high fever", "temperature", "feverish", "pyrexia"]
  },
  chills: {
    label: "Chills",
    aliases: ["chills", "shivering", "rigors"]
  },
  cough: {
    label: "Cough",
    aliases: ["cough", "dry cough", "productive cough", "coughing"]
  },
  sore_throat: {
    label: "Sore throat",
    aliases: ["sore throat", "throat pain", "scratchy throat"]
  },
  runny_nose: {
    label: "Runny or blocked nose",
    aliases: ["runny nose", "blocked nose", "stuffy nose", "congestion", "nasal congestion"]
  },
  sneezing: {
    label: "Sneezing",
    aliases: ["sneezing", "sneeze"]
  },
  itchy_eyes: {
    label: "Itchy or watery eyes",
    aliases: ["itchy eyes", "watery eyes", "eye itching", "red eyes"]
  },
  headache: {
    label: "Headache",
    aliases: ["headache", "head pain", "migraine"]
  },
  body_aches: {
    label: "Body aches",
    aliases: ["body aches", "muscle pain", "muscle aches", "joint pain", "bone pain", "myalgia"]
  },
  fatigue: {
    label: "Fatigue",
    aliases: ["fatigue", "tiredness", "weakness", "low energy", "exhaustion"]
  },
  shortness_of_breath: {
    label: "Shortness of breath",
    aliases: ["shortness of breath", "trouble breathing", "difficulty breathing", "breathlessness", "breathing problem"]
  },
  wheezing: {
    label: "Wheezing",
    aliases: ["wheezing", "whistling breath"]
  },
  chest_pain: {
    label: "Chest pain or pressure",
    aliases: ["chest pain", "chest pressure", "chest tightness", "pain in chest"]
  },
  loss_of_taste_smell: {
    label: "Loss of taste or smell",
    aliases: ["loss of taste", "loss of smell", "lost taste", "lost smell", "anosmia"]
  },
  nausea: {
    label: "Nausea",
    aliases: ["nausea", "feeling sick", "queasy"]
  },
  vomiting: {
    label: "Vomiting",
    aliases: ["vomiting", "vomit", "throwing up"]
  },
  diarrhea: {
    label: "Diarrhea",
    aliases: ["diarrhea", "diarrhoea", "loose motion", "loose motions", "watery stool"]
  },
  abdominal_pain: {
    label: "Abdominal pain",
    aliases: ["abdominal pain", "stomach pain", "belly pain", "cramps", "stomach cramps"]
  },
  constipation: {
    label: "Constipation",
    aliases: ["constipation", "hard stool"]
  },
  rash: {
    label: "Rash",
    aliases: ["rash", "skin rash", "spots", "red spots"]
  },
  itching: {
    label: "Itching",
    aliases: ["itching", "itchy skin", "pruritus"]
  },
  eye_pain: {
    label: "Eye pain",
    aliases: ["eye pain", "pain behind eyes", "pain behind the eyes"]
  },
  sweating: {
    label: "Sweating",
    aliases: ["sweating", "night sweats", "sweats"]
  },
  burning_urination: {
    label: "Burning urination",
    aliases: ["burning urination", "burning pee", "painful urination", "pain while urinating", "dysuria"]
  },
  frequent_urination: {
    label: "Frequent urination",
    aliases: ["frequent urination", "urinating often", "peeing a lot", "frequent pee"]
  },
  excessive_thirst: {
    label: "Excessive thirst",
    aliases: ["excessive thirst", "very thirsty", "increased thirst", "polydipsia"]
  },
  weight_loss: {
    label: "Unexplained weight loss",
    aliases: ["weight loss", "unexplained weight loss", "losing weight"]
  },
  blurry_vision: {
    label: "Blurry vision",
    aliases: ["blurry vision", "blurred vision"]
  },
  yellow_eyes: {
    label: "Yellow eyes or skin",
    aliases: ["yellow eyes", "yellow skin", "jaundice"]
  },
  dark_urine: {
    label: "Dark urine",
    aliases: ["dark urine", "brown urine"]
  },
  confusion: {
    label: "Confusion",
    aliases: ["confusion", "confused", "disoriented", "new confusion"]
  },
  dizziness: {
    label: "Dizziness",
    aliases: ["dizziness", "dizzy", "light headed", "lightheaded", "fainting"]
  },
  seizure: {
    label: "Seizure",
    aliases: ["seizure", "fits", "convulsion"]
  },
  dehydration: {
    label: "Signs of dehydration",
    aliases: ["dehydration", "not urinating", "no urine", "dry mouth", "very little urine"]
  },
  blue_lips: {
    label: "Pale, blue, or gray lips/skin",
    aliases: ["blue lips", "bluish lips", "gray lips", "pale lips", "blue face", "bluish face"]
  },
  cannot_wake: {
    label: "Cannot wake or stay awake",
    aliases: ["cannot wake", "hard to wake", "unable to wake", "cannot stay awake", "unresponsive"]
  },
  stiff_neck: {
    label: "Stiff neck",
    aliases: ["stiff neck", "neck stiffness"]
  },
  blood_in_stool: {
    label: "Blood in stool",
    aliases: ["blood in stool", "bloody stool", "blood in poop"]
  }
};

const CONDITION_PROFILES = [
  {
    id: "common_cold",
    name: "Common cold",
    category: "Respiratory",
    symptoms: {
      runny_nose: 3,
      sneezing: 2.4,
      sore_throat: 1.8,
      cough: 1.5,
      headache: 0.8,
      fatigue: 0.7
    },
    advice: "Usually mild. Rest, fluids, and monitoring are reasonable if symptoms stay mild.",
    defaultUrgency: "self_care"
  },
  {
    id: "influenza_like_illness",
    name: "Influenza-like illness",
    category: "Respiratory",
    symptoms: {
      fever: 2.7,
      chills: 2.1,
      cough: 2.2,
      body_aches: 2.4,
      headache: 1.5,
      fatigue: 2,
      sore_throat: 1,
      runny_nose: 0.8
    },
    advice: "Consider flu/COVID testing where available, avoid close contact, hydrate, and seek care if worsening or high risk.",
    defaultUrgency: "routine",
    sources: [MEDICAL_SOURCES[0].url]
  },
  {
    id: "covid_19_like_illness",
    name: "COVID-19-like illness",
    category: "Respiratory",
    symptoms: {
      fever: 1.8,
      cough: 2.1,
      sore_throat: 1.4,
      runny_nose: 1.2,
      shortness_of_breath: 2.4,
      loss_of_taste_smell: 3,
      fatigue: 1.5,
      headache: 1.2,
      body_aches: 1.2,
      nausea: 0.7,
      diarrhea: 0.9
    },
    advice: "Consider COVID testing and reduce exposure to others. Seek prompt care if high risk or symptoms worsen.",
    defaultUrgency: "routine",
    sources: [MEDICAL_SOURCES[1].url]
  },
  {
    id: "allergic_rhinitis",
    name: "Allergic rhinitis",
    category: "Allergy",
    symptoms: {
      sneezing: 2.8,
      runny_nose: 2.5,
      itchy_eyes: 2.6,
      cough: 0.6,
      headache: 0.5
    },
    advice: "Pattern may fit allergies, especially without fever. Consider trigger avoidance and non-urgent clinician advice if persistent.",
    defaultUrgency: "self_care"
  },
  {
    id: "asthma_or_bronchospasm",
    name: "Asthma or bronchospasm pattern",
    category: "Respiratory",
    symptoms: {
      wheezing: 3,
      shortness_of_breath: 2.8,
      chest_pain: 1.4,
      cough: 1.5,
      fatigue: 0.5
    },
    advice: "Breathing symptoms can become serious. Follow any existing asthma plan and seek care urgently if breathing is hard.",
    defaultUrgency: "urgent"
  },
  {
    id: "pneumonia_or_chest_infection",
    name: "Pneumonia or chest infection pattern",
    category: "Respiratory",
    symptoms: {
      fever: 2,
      cough: 2.4,
      shortness_of_breath: 2.7,
      chest_pain: 1.8,
      chills: 1.4,
      fatigue: 1.2
    },
    advice: "Chest infection patterns should be checked by a clinician, especially with breathing difficulty, chest pain, or fever.",
    defaultUrgency: "urgent",
    sources: [MEDICAL_SOURCES[2].url]
  },
  {
    id: "viral_gastroenteritis_or_food_poisoning",
    name: "Gastroenteritis or food poisoning pattern",
    category: "Digestive",
    symptoms: {
      diarrhea: 2.8,
      vomiting: 2.5,
      nausea: 1.8,
      abdominal_pain: 2,
      fever: 1,
      dehydration: 1.8
    },
    advice: "Focus on fluids and dehydration monitoring. Seek care for blood in stool, severe pain, dehydration, or persistent vomiting.",
    defaultUrgency: "routine"
  },
  {
    id: "migraine_pattern",
    name: "Migraine pattern",
    category: "Neurologic",
    symptoms: {
      headache: 3,
      nausea: 1.8,
      vomiting: 1.2,
      dizziness: 1,
      fatigue: 0.8
    },
    advice: "A familiar migraine pattern may be managed with an existing care plan. New, sudden, or severe headaches need medical advice.",
    defaultUrgency: "routine"
  },
  {
    id: "dengue_like_viral_fever",
    name: "Dengue-like viral fever pattern",
    category: "Fever",
    symptoms: {
      fever: 2.8,
      headache: 1.6,
      eye_pain: 2.2,
      body_aches: 2.4,
      rash: 1.8,
      nausea: 1,
      fatigue: 1.1
    },
    advice: "High fever with severe aches, eye pain, or rash should be discussed with a clinician, especially in dengue-prone areas.",
    defaultUrgency: "urgent"
  },
  {
    id: "malaria_like_fever",
    name: "Malaria-like fever pattern",
    category: "Fever",
    symptoms: {
      fever: 2.7,
      chills: 2.7,
      sweating: 2.2,
      headache: 1.3,
      body_aches: 1.3,
      nausea: 0.8,
      fatigue: 1
    },
    advice: "Fever with chills/sweats after mosquito exposure or travel needs prompt testing and clinician care.",
    defaultUrgency: "urgent"
  },
  {
    id: "typhoid_like_fever",
    name: "Typhoid-like fever pattern",
    category: "Fever",
    symptoms: {
      fever: 2.6,
      headache: 1.4,
      abdominal_pain: 1.7,
      constipation: 1.1,
      diarrhea: 1,
      fatigue: 1.5,
      nausea: 0.8
    },
    advice: "Persistent fever with digestive symptoms should be evaluated by a clinician and may need testing.",
    defaultUrgency: "urgent"
  },
  {
    id: "urinary_tract_infection",
    name: "Urinary tract infection pattern",
    category: "Urinary",
    symptoms: {
      burning_urination: 3,
      frequent_urination: 2.5,
      abdominal_pain: 1.2,
      fever: 1.2,
      nausea: 0.6
    },
    advice: "Painful or frequent urination can need testing and treatment, especially with fever, pregnancy, or back pain.",
    defaultUrgency: "routine"
  },
  {
    id: "diabetes_warning_pattern",
    name: "Diabetes warning pattern",
    category: "Metabolic",
    symptoms: {
      excessive_thirst: 2.8,
      frequent_urination: 2.6,
      fatigue: 1.5,
      weight_loss: 2,
      blurry_vision: 1.5
    },
    advice: "This pattern should be checked with blood sugar testing and clinician follow-up.",
    defaultUrgency: "routine"
  },
  {
    id: "jaundice_or_hepatitis_pattern",
    name: "Jaundice or hepatitis pattern",
    category: "Liver",
    symptoms: {
      yellow_eyes: 3,
      dark_urine: 2.2,
      fatigue: 1.2,
      nausea: 1,
      abdominal_pain: 1.4,
      fever: 0.8
    },
    advice: "Yellow eyes/skin or dark urine should be evaluated by a clinician.",
    defaultUrgency: "urgent"
  },
  {
    id: "chickenpox_or_viral_rash_pattern",
    name: "Chickenpox or viral rash pattern",
    category: "Skin",
    symptoms: {
      rash: 2.8,
      itching: 2.3,
      fever: 1.3,
      fatigue: 1,
      headache: 0.7
    },
    advice: "Rash with fever may be contagious or require evaluation, especially for pregnancy, infants, or immune problems.",
    defaultUrgency: "routine"
  }
];

const URGENCY_ORDER = {
  self_care: 0,
  routine: 1,
  urgent: 2,
  emergency: 3
};

const RED_FLAG_RULES = [
  {
    symptom: "shortness_of_breath",
    level: "emergency",
    reason: "Trouble breathing is an emergency warning sign."
  },
  {
    symptom: "chest_pain",
    level: "emergency",
    reason: "Persistent chest pain or pressure needs emergency assessment."
  },
  {
    symptom: "confusion",
    level: "emergency",
    reason: "New confusion is an emergency warning sign."
  },
  {
    symptom: "cannot_wake",
    level: "emergency",
    reason: "Inability to wake or stay awake is an emergency warning sign."
  },
  {
    symptom: "blue_lips",
    level: "emergency",
    reason: "Pale, blue, or gray lips/skin can indicate low oxygen."
  },
  {
    symptom: "seizure",
    level: "emergency",
    reason: "Seizures need immediate medical assessment."
  },
  {
    symptom: "dehydration",
    level: "urgent",
    reason: "Signs of dehydration should be checked promptly."
  },
  {
    symptom: "blood_in_stool",
    level: "urgent",
    reason: "Blood in stool should be evaluated promptly."
  },
  {
    symptom: "stiff_neck",
    level: "urgent",
    reason: "Stiff neck with illness can be serious and should be checked promptly."
  }
];

const ALIAS_TO_SYMPTOM = Object.entries(SYMPTOMS).reduce((acc, [id, config]) => {
  acc[normaliseText(config.label)] = id;
  for (const alias of config.aliases) {
    acc[normaliseText(alias)] = id;
  }
  return acc;
}, {});

function normaliseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasNegation(value) {
  return /^(no|not|without|denies|denied)\s+/.test(normaliseText(value));
}

function splitSymptomText(value) {
  return String(value || "")
    .split(/[,;\n]|(?:\s+\+\s+)|(?:\s+and\s+)/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function inputToSymptomParts(symptoms) {
  if (Array.isArray(symptoms)) {
    return symptoms.flatMap(item => {
      if (typeof item === "string") return splitSymptomText(item);
      if (item && typeof item === "object") {
        return splitSymptomText(item.id || item.symptom || item.name || item.label || "");
      }
      return [];
    });
  }
  if (typeof symptoms === "string") return splitSymptomText(symptoms);
  return [];
}

function matchSymptom(rawValue) {
  if (!rawValue || hasNegation(rawValue)) return null;

  const normalised = normaliseText(rawValue);
  if (!normalised) return null;
  if (ALIAS_TO_SYMPTOM[normalised]) return ALIAS_TO_SYMPTOM[normalised];

  const aliases = Object.keys(ALIAS_TO_SYMPTOM).sort((a, b) => b.length - a.length);
  const alias = aliases.find(candidate => {
    if (candidate.length < 4) return false;
    return normalised.includes(candidate) || candidate.includes(normalised);
  });

  return alias ? ALIAS_TO_SYMPTOM[alias] : null;
}

function normaliseSymptoms(input = {}) {
  const rawSymptoms = input.symptoms ?? input.text ?? input.query ?? [];
  const parts = inputToSymptomParts(rawSymptoms);
  const recognised = new Map();
  const unknownSymptoms = [];

  for (const part of parts) {
    const symptomId = matchSymptom(part);
    if (symptomId) {
      recognised.set(symptomId, {
        id: symptomId,
        label: SYMPTOMS[symptomId].label,
        matchedFrom: part
      });
    } else {
      unknownSymptoms.push(part);
    }
  }

  return {
    recognisedSymptoms: [...recognised.values()],
    symptomSet: new Set(recognised.keys()),
    unknownSymptoms
  };
}

function calculateProfileScore(profile, symptomSet) {
  const profileSymptoms = Object.entries(profile.symptoms);
  const totalWeight = profileSymptoms.reduce((sum, [, weight]) => sum + weight, 0);
  let matchedWeight = 0;
  const matchedSymptoms = [];
  const missingKeySymptoms = [];

  for (const [symptomId, weight] of profileSymptoms) {
    if (symptomSet.has(symptomId)) {
      matchedWeight += weight;
      matchedSymptoms.push({
        id: symptomId,
        label: SYMPTOMS[symptomId].label,
        weight
      });
    } else if (weight >= 1.7) {
      missingKeySymptoms.push({
        id: symptomId,
        label: SYMPTOMS[symptomId].label,
        weight
      });
    }
  }

  const extraKnownSymptoms = [...symptomSet].filter(symptomId => !profile.symptoms[symptomId]).length;
  const coverageScore = totalWeight ? matchedWeight / totalWeight : 0;
  const extraPenalty = Math.min(0.2, extraKnownSymptoms * 0.025);
  const rawScore = Math.max(0, coverageScore - extraPenalty);

  return {
    rawScore,
    matchedWeight,
    totalWeight,
    matchedSymptoms: matchedSymptoms.sort((a, b) => b.weight - a.weight),
    missingKeySymptoms: missingKeySymptoms.sort((a, b) => b.weight - a.weight)
  };
}

function confidenceForScore(score) {
  if (score >= 0.68) return "high";
  if (score >= 0.38) return "medium";
  return "low";
}

function bumpUrgency(current, next) {
  return URGENCY_ORDER[next] > URGENCY_ORDER[current] ? next : current;
}

function riskContext(input = {}) {
  const age = Number(input.age);
  const ageMonths = Number(input.ageMonths);
  const pregnant = Boolean(input.pregnant);
  const chronicConditions = Array.isArray(input.chronicConditions) ? input.chronicConditions.filter(Boolean) : [];
  const immunocompromised = Boolean(input.immunocompromised);

  return {
    age: Number.isFinite(age) ? age : null,
    ageMonths: Number.isFinite(ageMonths) ? ageMonths : null,
    pregnant,
    chronicConditions,
    immunocompromised,
    durationDays: Number.isFinite(Number(input.durationDays)) ? Number(input.durationDays) : null
  };
}

function assessUrgency(symptomSet, input = {}, topCondition = null) {
  const context = riskContext(input);
  let level = topCondition?.defaultUrgency || "self_care";
  const reasons = [];

  for (const rule of RED_FLAG_RULES) {
    if (!symptomSet.has(rule.symptom)) continue;
    level = bumpUrgency(level, rule.level);
    reasons.push(rule.reason);
  }

  if ((context.ageMonths !== null && context.ageMonths <= 3) && symptomSet.has("fever")) {
    level = bumpUrgency(level, "emergency");
    reasons.push("Fever in a baby 3 months or younger needs immediate medical care.");
  }

  const highRisk = (
    (context.age !== null && context.age >= 65) ||
    (context.age !== null && context.age < 5) ||
    context.pregnant ||
    context.immunocompromised ||
    context.chronicConditions.length > 0
  );

  const infectiousPattern = ["fever", "cough", "shortness_of_breath", "vomiting", "diarrhea"].some(id => symptomSet.has(id));
  if (highRisk && infectiousPattern) {
    level = bumpUrgency(level, "urgent");
    reasons.push("Higher-risk health context with infectious symptoms should be checked promptly.");
  }

  if (context.durationDays !== null && context.durationDays >= 3 && symptomSet.has("fever")) {
    level = bumpUrgency(level, "urgent");
    reasons.push("Fever lasting 3 or more days should be discussed with a clinician.");
  }

  if (!reasons.length) {
    reasons.push("No emergency red flags were recognised from the submitted symptoms.");
  }

  const action = {
    emergency: "Seek emergency medical help now.",
    urgent: "Arrange prompt medical advice or urgent care, especially if symptoms are worsening.",
    routine: "Consider non-urgent medical advice if symptoms persist, worsen, or concern you.",
    self_care: "Monitor symptoms and use normal self-care if they remain mild."
  }[level];

  return { level, action, reasons };
}

function buildPredictions(symptomSet) {
  const scored = CONDITION_PROFILES
    .map(profile => {
      const score = calculateProfileScore(profile, symptomSet);
      return { profile, ...score };
    })
    .filter(item => item.rawScore > 0.05 && item.matchedSymptoms.length > 0)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 5);

  const softTotal = scored.reduce((sum, item) => sum + Math.pow(item.rawScore, 1.3), 0) || 1;

  return scored.map(item => {
    const relativeLikelihood = Math.round((Math.pow(item.rawScore, 1.3) / softTotal) * 100);
    return {
      id: item.profile.id,
      condition: item.profile.name,
      category: item.profile.category,
      score: Math.round(item.rawScore * 100),
      relativeLikelihood,
      confidence: confidenceForScore(item.rawScore),
      matchedSymptoms: item.matchedSymptoms.map(symptom => symptom.label),
      missingKeySymptoms: item.missingKeySymptoms.slice(0, 4).map(symptom => symptom.label),
      careAdvice: item.profile.advice,
      defaultUrgency: item.profile.defaultUrgency,
      sources: item.profile.sources || []
    };
  });
}

function buildNextSteps(urgency, predictions, unknownSymptoms) {
  const steps = [
    urgency.action,
    "Use this as a screening aid only; confirm health decisions with a qualified medical professional."
  ];

  if (unknownSymptoms.length) {
    steps.push(`Review unrecognised symptoms manually: ${unknownSymptoms.slice(0, 5).join(", ")}.`);
  }

  if (predictions[0]) {
    steps.push(`Top pattern to discuss or investigate: ${predictions[0].condition}.`);
  }

  return steps;
}

function predictDisease(input = {}) {
  const { recognisedSymptoms, symptomSet, unknownSymptoms } = normaliseSymptoms(input);

  if (!recognisedSymptoms.length) {
    return {
      success: false,
      message: "Add at least one recognised symptom.",
      recognisedSymptoms: [],
      unknownSymptoms,
      knownSymptoms: listKnownSymptoms(),
      disclaimer: DISEASE_PREDICTION_DISCLAIMER
    };
  }

  const predictions = buildPredictions(symptomSet);
  const topProfile = predictions[0]
    ? CONDITION_PROFILES.find(profile => profile.id === predictions[0].id)
    : null;
  const urgency = assessUrgency(symptomSet, input, topProfile);

  return {
    success: true,
    disclaimer: DISEASE_PREDICTION_DISCLAIMER,
    model: {
      name: "Weighted symptom profile disease prediction model",
      version: DISEASE_MODEL_VERSION,
      type: "weighted-symptom-profile-classifier",
      trainingData: "Curated symptom-condition profiles; no patient records or private data."
    },
    input: {
      recognisedSymptoms,
      unknownSymptoms,
      context: riskContext(input)
    },
    urgency,
    predictions,
    suggestedNextSteps: buildNextSteps(urgency, predictions, unknownSymptoms),
    medicalSources: MEDICAL_SOURCES
  };
}

function listKnownSymptoms() {
  return Object.entries(SYMPTOMS)
    .map(([id, symptom]) => ({
      id,
      label: symptom.label,
      examples: symptom.aliases.slice(0, 4)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

module.exports = {
  DISEASE_MODEL_VERSION,
  DISEASE_PREDICTION_DISCLAIMER,
  MEDICAL_SOURCES,
  predictDisease,
  listKnownSymptoms
};
