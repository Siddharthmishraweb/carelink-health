# CareLink architecture

## Tenancy

```text
Platform
 ├── City Care Hospital
 ├── Lotus Multispeciality
 └── Sunrise Clinic (pending approval)
```

Hospital-scoped collections store `hospitalId`. Staff JWT tokens carry that id. Super admins omit the tenant filter. Patients can belong to more than one hospital through `hospitalIds`.

## Visit pipeline

```text
Appointment
  → Queue item + token
  → Nurse vitals on the consultation
  → Doctor consult + optional AI draft
  → Doctor approve
  → Prescription + pharmacy order
  → Lab order + report
  → Invoice + payment
  → Timeline event + follow-up notification
```

## Realtime

Socket.IO rooms:

- `hospital:<id>` for display screens
- `queue:<id>` for a doctor’s queue
- `user:<id>` reserved for direct notices

Queue state is also cached in Redis when Redis is available.

## AI safety

`aiService` only extracts information that already appears in the transcript or clinician notes. It does not invent diagnoses or prescribe independently. The consultation stays `pending_review` until a doctor calls approve.

## Storage

Uploaded files go to `backend/uploads` with a stored relative path. Production deployments should replace this with private object storage and short-lived URLs.

## Local database fallback

If `MONGO_URI` is unreachable, `mongodb-memory-server` starts a persistent instance under `backend/.data/mongo`. Nodemon watches only `src/`, so database writes do not restart the API.

## Frontend

Create React App proxies `/api` and `/socket.io` to port 5000. Redux keeps the JWT and role extras in `localStorage` key `carelink.auth`. Route guards send each role to its workspace.
