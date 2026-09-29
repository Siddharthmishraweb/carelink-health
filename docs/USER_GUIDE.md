# CareLink user guide

Password for all demo accounts: `Demo@12345`

## Patient

1. Open http://localhost:3000 and sign in as `rahul@demo.health`.
2. **Find doctor** to see hospitals, doctors, and today’s slots. Book a slot.
3. On Home, open **Track queue** to join the digital queue and see patients ahead plus estimated wait.
4. **Medical records** shows the health timeline (consultations, prescriptions, labs).
5. **My family** lists linked members and can add a new one.
6. **Health camps** lists free camps. Register to receive a QR pass.
7. **Emergency** shows the configured critical card and Health ID QR.
8. **Bills** can mark an outstanding invoice as paid (demo UPI).
9. **Vault** uploads documents to the patient record.

The Health ID QR only identifies the patient. It does not reveal the full chart.

## Doctor

1. Sign in as `amit.sharma@citycare.health`.
2. **Today** shows counts, the current token, and the live queue.
3. **Call next** advances the queue and notifies the patient.
4. **Start consultation** opens notes, medicines, tests, and follow-up.
5. Capture consent, then **Generate draft**. The banner always says doctor review is required.
6. **Approve and complete** writes the record, prescription, optional lab order, invoice, and follow-up reminder.
7. **Refer patient** creates a handoff for another clinician.
8. **Patients** searches authorized records. Access is audited.

## Reception

1. Sign in as `reception@citycare.health`.
2. Register a walk-in or search by name, phone, or Health ID.
3. Mark a booked patient as arrived (joins queue) or no-show.

## Nurse

1. Sign in as `nurse@citycare.health`.
2. Select a patient from today’s list.
3. Save vitals. The patient is marked ready for the doctor.

## Pharmacy

1. Sign in as `pharmacy@citycare.health`.
2. Dispense a queued prescription. An invoice is created when there is a total.
3. Stock alerts show medicines at or below reorder level.

## Laboratory

1. Sign in as `lab@citycare.health`.
2. Collect a sample, enter a result, then release the report.
3. The patient receives an in-app notification when the report is ready.

## Hospital admin

1. Sign in as `admin@citycare.health`.
2. Command center shows patients, appointments, beds, queues, and revenue.
3. Staff, patients, appointments, beds, pharmacy, labs, billing, camps, inventory, and announcements are in the sidebar.
4. **Queue display** opens the TV screen.

## Super admin

1. Sign in as `superadmin@carelink.health`.
2. Approve or reject hospital onboarding.
3. Review users, subscription plans, camps, support tickets, and audit logs.

## Typical connected visit

1. Patient books an OPD slot.
2. Reception or the patient app puts them in the queue.
3. Nurse records vitals.
4. Doctor consults, reviews the AI draft, and approves.
5. Prescription goes to pharmacy; tests go to the lab.
6. Patient pays and later sees the visit on the health timeline.
7. A follow-up reminder is created from the doctor’s documented plan only.
