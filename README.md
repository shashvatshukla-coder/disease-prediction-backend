# Disease Prediction Backend

A local Express app for educational symptom-based disease prediction. It includes a browser UI, a weighted symptom-profile classifier, and API endpoints for supported symptoms and predictions.

## Run Locally

```powershell
npm.cmd install
npm.cmd start
```

Open:

```text
http://127.0.0.1:3000/
```

## API

```http
GET /disease-prediction/symptoms
POST /disease-prediction/predict
```

Example:

```json
{
  "symptoms": ["fever", "cough", "body aches", "fatigue"],
  "age": 28,
  "durationDays": 2
}
```

## Safety

This project is educational triage only. It is not a diagnosis and does not replace a licensed clinician.
