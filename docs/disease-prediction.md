# Disease Prediction API

This backend includes an educational symptom-based disease prediction model. It is a weighted symptom profile classifier, not a medical diagnosis engine.

## Safety note

The API response includes this disclaimer:

> Educational symptom triage only. This is not a diagnosis and does not replace a licensed clinician.

If the response returns `urgency.level: "emergency"`, the user should seek emergency medical help now.

Medical red-flag handling was checked against:

- CDC flu signs, symptoms, and emergency warning signs: https://www.cdc.gov/flu/signs-symptoms/index.html
- CDC COVID-19 symptoms and emergency warning signs: https://www.cdc.gov/covid/signs-symptoms/index.html
- NHS chest pain emergency guidance: https://www.nhs.uk/symptoms/chest-pain/

## List supported symptoms

```http
GET /disease-prediction/symptoms
```

Returns supported symptom IDs, display labels, and accepted examples.

## Doctor workspace persistence

When `MONGODB_URI` is configured, these authenticated endpoints persist the
doctor dashboard data in MongoDB:

```http
GET /doctor-workspace
PUT /doctor-workspace
Content-Type: application/json
```

The stored workspace contains:

- `patients`
- `medicines`
- `dailyRecords`
- `followUps`
- `criticalCases`
- `handovers`

If `MONGODB_URI` is not configured, the API reports `storage: "local"` and the
browser keeps using localStorage.

## Predict from symptoms

```http
POST /disease-prediction/predict
Content-Type: application/json

{
  "symptoms": ["fever", "dry cough", "body aches", "fatigue"],
  "age": 28,
  "durationDays": 1,
  "pregnant": false,
  "chronicConditions": []
}
```

`symptoms` can be an array or a comma-separated string. The model accepts common aliases like `temperature`, `loose motions`, `stomach cramps`, and `trouble breathing`.

Example response shape:

```json
{
  "success": true,
  "urgency": {
    "level": "routine",
    "action": "Consider non-urgent medical advice if symptoms persist, worsen, or concern you.",
    "reasons": ["No emergency red flags were recognised from the submitted symptoms."]
  },
  "predictions": [
    {
      "id": "influenza_like_illness",
      "condition": "Influenza-like illness",
      "score": 73,
      "relativeLikelihood": 64,
      "confidence": "high",
      "matchedSymptoms": ["Fever", "Cough", "Body aches", "Fatigue"]
    }
  ]
}
```

## Notes

- `score` is symptom-profile fit from 0 to 100.
- `relativeLikelihood` compares the returned candidates to each other; it is not a clinical probability.
- Use real clinical datasets and validation before using this in production healthcare workflows.
