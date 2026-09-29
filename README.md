# CareLink

Hospital management and patient care platform for the complete visit journey:

**Discover → Register → Book → Join queue → Consult → AI draft notes → Prescription → Labs → Pharmacy → Billing → Records → Follow-up**

CareLink is a multi-tenant SaaS. Each hospital’s records stay isolated. Patients, doctors, reception, nursing, pharmacy, laboratory, hospital admins, and the platform owner each have a dedicated workspace.

## Features

- Role-based access for 8 roles plus super admin
- Digital queue and wait-from-home estimates
- Full-screen TV / display mode with live tokens
- Doctor consultation with AI draft notes (doctor approval required)
- Patient health timeline, family profiles, and document vault
- Health camp discovery and QR passes
- Digital Health ID (identification only, not a full chart)
- Pharmacy, laboratory, billing, beds, inventory
- Hospital analytics and platform audit logs
- Hindi / English labels on key patient screens

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, React Router, Redux Toolkit, React Bootstrap, Recharts |
| Backend | Node.js, Express, JWT, RBAC |
| Database | MongoDB + Mongoose |
| Cache | Redis, or in-memory fallback |
| Realtime | Socket.IO |
| Uploads | Local `uploads/` (S3-ready path) |

Vite and Tailwind CSS are not used.

## Quick start

MongoDB and Redis are optional. If they are not installed, the API starts a local database, uses an in-memory cache, and seeds demo data on first boot.

```bash
npm run install:all
npm start
```

`npm start` runs the API and the web app together. Open [http://localhost:3000](http://localhost:3000).

Optional local infrastructure:

```bash
docker compose up -d
cd backend
copy .env.example .env
npm run seed
```

## Demo accounts

Password for every demo user: `Demo@12345`

| Role | Email | After login |
| --- | --- | --- |
| Patient | rahul@demo.health | `/app` |
| Doctor | amit.sharma@citycare.health | `/doctor` |
| Hospital admin | admin@citycare.health | `/admin` |
| Reception | reception@citycare.health | `/reception` |
| Nurse | nurse@citycare.health | `/nurse` |
| Pharmacy | pharmacy@citycare.health | `/pharmacy` |
| Lab | lab@citycare.health | `/lab` |
| Super admin | superadmin@carelink.health | `/super` |

Queue TV display: [http://localhost:3000/display](http://localhost:3000/display)

## Verify flows

With the API running:

```bash
npm run verify --prefix backend
```

This logs in as every role and exercises booking, queue, consultation draft, vitals, camps, billing, pharmacy, lab, analytics, and search.

## Project structure

```text
backend/          Express API, models, seed, sockets
frontend/         Create React App UI
docs/             User guide, API, and architecture
docker-compose.yml
```

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [API reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)

## Safety rules

- AI output is always a draft. A doctor must review it before it becomes a medical record.
- A Health ID QR only identifies the patient. It does not open the full chart.
- Queue priority comes from hospital policy weights, not hard-coded clinical rules.
- Sensitive record access is written to the audit log.
- Hospitals cannot see another hospital’s private records.

## Environment

See `backend/.env.example`.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Sign-in token secret |
| `CLIENT_ORIGIN` | Frontend origin for CORS |

Never commit a real `.env` file.

## License

Private project unless you add a license file.
