# Disease Prediction Backend

A local Express app for educational symptom-based disease prediction and hospital workflow support. It includes doctor login, an operations command board, daily patient records, medicine completion tracking, clinical notes, follow-up tasks, critical watchlist, shift handover, patient search, printable briefings, and JSON/CSV export.

## Run Locally

```powershell
npm.cmd install
npm.cmd start
```

Open:

```text
http://127.0.0.1:3000/
```

Default local doctor login:

```text
Username: doctor
Password: doctor123
```

You can change the local account with environment variables:

```env
DOCTOR_USERNAME=doctor
DOCTOR_PASSWORD=doctor123
DOCTOR_NAME=Dr. Local Clinic
CLINIC_NAME=Disease Prediction Clinic
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/disease-prediction?retryWrites=true&w=majority
```

`MONGODB_URI` is optional for local demo mode. When it is set, patient records,
medicine completion, daily notes, follow-ups, critical cases, and handovers are
saved to MongoDB. Without it, the browser falls back to localStorage.

## API

```http
POST /auth/login
GET /auth/me
POST /auth/logout
GET /doctor-workspace
PUT /doctor-workspace
GET /disease-prediction/symptoms
POST /disease-prediction/predict
```

The doctor workspace and disease prediction APIs require a signed-in doctor session.

## MongoDB Atlas + Render

1. Create a MongoDB Atlas cluster.
2. Create a database user and password.
3. Allow network access from Render. For a simple demo, Atlas can allow
   `0.0.0.0/0`; for production, restrict this more carefully.
4. Copy the Node.js connection string and replace the username, password, and
   database name.
5. In Render, add this environment variable:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/disease-prediction?retryWrites=true&w=majority
```

Redeploy the Render service after saving the environment variable.

## Doctor Workflow Features

- Operations command board for OPD, critical cases, follow-ups, and handovers
- Patient records with status and main concern
- Medicine completion tracking with progress percentage
- Daily clinical notes with BP, pulse, temperature, and doctor note
- Critical watchlist for high-risk patients
- Shift handover notes for continuity of care
- Unified patient search across saved local records
- Daily briefing with print, JSON export, and CSV export

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
