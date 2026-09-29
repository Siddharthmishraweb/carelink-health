# CareLink API

Base URL: `http://localhost:5000/api`

Most routes require `Authorization: Bearer <token>` from `POST /auth/login`.

## Auth

| Method | Path | Who |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Signed in |
| PATCH | `/auth/preferences` | Signed in |

## Hospitals and directory

| Method | Path | Who |
| --- | --- | --- |
| GET | `/hospitals` | Public (active hospitals) |
| GET | `/hospitals/:id` | Public |
| POST / PUT | `/hospitals`, `/hospitals/:id` | Super / hospital admin |
| POST | `/hospitals/:id/status` | Super admin |
| GET | `/doctors` | Public / signed in |
| GET | `/doctors/:doctorId/slots` | Signed in |

## Patients and family

| Method | Path | Who |
| --- | --- | --- |
| GET | `/patients` | Clinical / admin staff |
| GET | `/patients/:id` | Owner or authorized staff (audited) |
| POST | `/patients/walk-in` | Reception |
| GET | `/patients/:patientId/timeline` | Authorized |
| GET / POST | `/family` | Patient |

## Appointments and queue

| Method | Path | Who |
| --- | --- | --- |
| GET / POST | `/appointments` | Signed in |
| PATCH | `/appointments/:id` | Staff |
| POST | `/appointments/:id/queue` | Patient or reception |
| GET | `/queues/:doctorId` | Signed in |
| POST | `/queues/:id/next` | Doctor / reception / admin |
| GET | `/queues/display/:hospitalId` | Public display |

## Consultation

| Method | Path | Who |
| --- | --- | --- |
| POST | `/consultations/start/:appointmentId` | Doctor / nurse |
| POST | `/consultations/vitals/:appointmentId` | Nurse / doctor |
| POST | `/consultations/:id/ai-draft` | Doctor, consent required |
| POST | `/consultations/:id/approve` | Doctor |

AI drafts never become the official record until approve is called.

## Clinical services

| Area | Prefix |
| --- | --- |
| Prescriptions | `/prescriptions` |
| Labs | `/labs/tests`, `/labs/orders`, `/labs/reports`, `/labs/compare` |
| Pharmacy | `/pharmacy/medicines`, `/pharmacy/orders` |
| Billing | `/billing/invoices`, `/billing/invoices/:id/pay` |
| Camps | `/health-camps`, `/health-camps/mine` |
| Beds | `/beds`, `/wards` |
| Inventory | `/inventory` |
| Documents | `/documents` |
| Referrals | `/referrals` |
| Feedback | `/feedback` |
| Second opinion | `/second-opinions` |

## Platform

| Method | Path | Who |
| --- | --- | --- |
| GET | `/analytics/hospital` | Hospital / super admin |
| GET | `/analytics/doctor` | Doctor |
| GET | `/analytics/platform` | Super admin |
| GET | `/search?q=` | Authorized staff |
| GET | `/audit-logs` | Admin |
| GET | `/emergency/:healthId` | Public identification card only |
| GET | `/health-id` | Signed in |

## Errors

JSON body:

```json
{ "success": false, "message": "Human-readable reason" }
```

Common status codes: `401` session, `403` role/tenant, `404` missing, `409` conflict, `422` validation.
