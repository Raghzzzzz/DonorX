# 🩸 DonorX

> **Real-time emergency blood & organ matching platform for hospitals — powered by AI, geospatial routing, and cryptographic audit trails.**

[![Google Solution Challenge](https://img.shields.io/badge/Google%20Solution%20Challenge-2026-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/community/gdsc-solution-challenge)
[![SDG 3](https://img.shields.io/badge/SDG%203-Good%20Health%20%26%20Well--Being-4CAF50?style=for-the-badge)](https://sdgs.un.org/goals/goal3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## 🚨 The Problem

Every year, thousands of patients die not because blood or organs are unavailable — but because hospitals can't find them **fast enough**. Inter-hospital coordination still relies on phone calls, WhatsApp groups, and manual inventory checks. In a trauma emergency, minutes matter.

**DonorX eliminates that gap.**

---

## ✨ What DonorX Does

When a patient urgently needs blood or an organ, DonorX:

1. **Parses the emergency** — via voice input or form (Gemini AI extracts patient name, blood group, urgency, and condition from free-form speech)
2. **Scores the request** — a rule-based priority engine ranks it 0–100 based on urgency, condition severity, time elapsed, and resource rarity
3. **Finds the nearest match** — geospatial search locates hospitals within a configurable radius that have matching inventory
4. **Notifies in real time** — matched hospitals see the incoming request instantly on their dashboard
5. **Tracks the lifecycle** — from Generated → Pending → Completed, with every action cryptographically logged
6. **Auto-expands search** — if no response in 5 minutes, the cron scheduler automatically widens the search radius

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Leaflet (maps), Lucide Icons |
| **Backend** | Node.js, Express 5, MongoDB, Mongoose |
| **AI** | Google Gemini API (voice parsing + triage) |
| **Auth** | JWT + bcryptjs |
| **Audit** | SHA-256 chained hash logs (blockchain-inspired) |
| **Scheduler** | node-cron (auto radius expansion) |
| **Logging** | Winston |

---

## 🗂 Project Structure

```
DonorX/
├── backend/
│   ├── controllers/       # authController, requestController, assistController, inventoryController
│   ├── models/            # Hospital, EmergencyRequest, AuditLog
│   ├── routes/            # auth, requests, assist, inventory
│   ├── services/          # matchingService, priorityService, workflowService, auditService
│   ├── middleware/        # authMiddleware, asyncHandler
│   ├── cron/              # scheduler.js (auto radius expansion)
│   └── server.js
└── frontend/
    ├── src/
    │   ├── pages/         # Home, Login, Register, Dashboard, HospitalDashboard,
    │   │                  # NewRequest, Tracking, Audit, Profile
    │   ├── components/    # Header, Modal, IncomingRequestModal, ToastContainer
    │   ├── context/       # DonorContext
    │   ├── hooks/         # useVoiceRequest
    │   └── services/      # api.js
    └── package.json
```

---

## ⚙️ Key Features

### 🤖 Gemini AI Voice Parsing
Speak or type freely — *"Critical patient, O negative blood, trauma case"* — and Gemini extracts all structured fields automatically. Supports Tamil language input.

### 📍 Geospatial Matching
Uses MongoDB `$geoWithin` + `$centerSphere` to find hospitals within a configurable radius. Auto-expands every 5 minutes via cron if no match accepts.

### 🏆 Priority Scoring Engine
Every request gets a score (0–100):
- **Urgency level** → up to 50 pts
- **Condition severity** → up to 20 pts
- **Time elapsed** → up to 20 pts
- **Resource rarity** (O-, AB-, organs) → up to 10 pts

### 🔐 Blockchain-Inspired Audit Trail
Every action (request created, match found, accepted, completed) is logged as a SHA-256 hash chained to the previous log entry — making the entire lifecycle tamper-evident and fully auditable.

### 📊 Real-time Dashboard
Separate views for requesting hospitals and donor hospitals. Incoming requests surface instantly with full patient context, priority score, and one-click accept.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API key

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
MONGO_URI=mongodb://localhost:27017/donorx
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

```bash
node server.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a hospital |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/requests` | Get all requests for hospital |
| POST | `/api/requests` | Create emergency request |
| PUT | `/api/requests/:id/accept` | Accept a request |
| PUT | `/api/requests/:id/status` | Update lifecycle status |
| GET | `/api/requests/:id/audit` | Get audit trail |
| POST | `/api/assist/parse` | Gemini AI voice/text parsing |
| GET | `/api/inventory` | Get hospital inventory |
| PUT | `/api/inventory` | Update inventory |

---

## 🌍 SDG Alignment

DonorX directly addresses **SDG 3 — Good Health and Well-Being**, specifically:

- **Target 3.8** — Universal access to quality healthcare services
- **Target 3.d** — Strengthen capacity for health risk management and emergency response

By digitizing and automating inter-hospital resource coordination, DonorX reduces the time-to-match in blood and organ emergencies from hours to seconds.

---

## 🔮 Roadmap

- [ ] Firebase Cloud Messaging push notifications
- [ ] Google Maps live tracking with ETA
- [ ] Individual donor registration portal
- [ ] Predictive inventory alerts via Gemini
- [ ] FHIR R4 export (Google Cloud Healthcare API)
- [ ] Multi-resource requests (blood + platelets in one request)
- [ ] Audit chain verification UI

---

