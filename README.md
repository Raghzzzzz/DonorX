# DonorX

DonorX is a full-stack healthcare emergency coordination platform that connects hospitals in real time to match blood and organ requests with available inventory. Built to support **UN Sustainable Development Goal 3 (Good Health and Well-Being)**, DonorX reduces critical response delays by combining geo-spatial matching, AI triage, blockchain-style audit trails, and live WebSocket notifications.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, React Router v6, Leaflet, Axios, Socket.io-client |
| **Backend** | Node.js, Express, JWT auth, node-cron, Winston logger, Socket.io |
| **Database** | MongoDB, Mongoose |
| **AI** | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| **Maps** | Leaflet + OpenStreetMap/CARTO tiles |

## Architecture Overview

- **Hospital registration & auth** — Hospitals register with geolocation; JWT tokens secure all private API routes.
- **Emergency request creation** — Clinicians submit patient details, urgency, and resource needs; priority scores are computed automatically.
- **Geo-spatial matching** — The matching engine finds nearby hospitals with compatible inventory (blood compatibility matrix for BLOOD, exact match for ORGAN).
- **Real-time notifications** — Socket.io pushes `new_request` and `request_accepted` events to hospital rooms instantly.
- **Workflow automation** — Cron jobs expand search radius after 5 minutes and handle match timeouts after 3 minutes.
- **Immutable audit trail** — Every workflow action is SHA-256 hash-chained for transparency and verification.

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Environment Variables

Create a `.env` file in `DonorX/backend/`:

```env
MONGO_URI=mongodb://localhost:27017/donorx
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Install Dependencies

```bash
# Backend
cd DonorX/backend
npm install

# Frontend
cd ../frontend
npm install
```

### Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd DonorX/backend
npm start

# Terminal 2 — Frontend (port 5173)
cd DonorX/frontend
npm run dev
```

### Run Tests

```bash
cd DonorX/backend
npm test
```

## Key Features

- **AI urgency prioritization** — Rule-based scoring ranks requests by urgency, condition, elapsed time, and resource rarity.
- **Real-time matching** — Geo-based hospital discovery with WebSocket push notifications.
- **Voice input in Tamil & English** — Hands-free emergency request capture via browser speech recognition.
- **Blockchain audit trail** — Hash-chained audit log with on-page chain verification.
- **AI triage summary** — Gemini generates a 2-sentence clinical brief for receiving hospitals.
- **Smart blood compatibility** — Medically accurate donor-recipient matching using a full ABO/Rh compatibility matrix.

## How It Works

### 1. Create Request
A hospital submits an emergency request with patient details, urgency level, and blood/organ requirements. DonorX calculates a priority score and generates an AI triage summary.

### 2. Match & Notify
The matching engine searches nearby hospitals for compatible inventory and pushes real-time alerts via WebSocket. If no hospital accepts within 3 minutes, the system expands the search radius automatically.

### 3. Accept & Track
A matched hospital accepts the request, inventory is locked, and the requesting hospital receives a live acceptance notification. All actions are recorded in the immutable audit trail.

## License

MIT
