/**
 * Exercises the main CareLink journeys against a running API.
 * Usage: node scripts/verify-flows.js
 */
const BASE = process.env.API_URL || 'http://127.0.0.1:5000/api';
const PASSWORD = 'Demo@12345';

const accounts = {
  patient: 'rahul@demo.health',
  doctor: 'amit.sharma@citycare.health',
  admin: 'admin@citycare.health',
  reception: 'reception@citycare.health',
  nurse: 'nurse@citycare.health',
  pharmacy: 'pharmacy@citycare.health',
  lab: 'lab@citycare.health',
  super: 'superadmin@carelink.health',
};

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${data.message || ''}`);
  }
  return data;
}

async function login(email) {
  const data = await req('POST', '/auth/login', { body: { email, password: PASSWORD } });
  if (!data.token || !data.user) throw new Error(`Login failed for ${email}`);
  return data;
}

async function run() {
  const health = await req('GET', '/health');
  if (!health.success) throw new Error('Health check failed');

  const hospitals = await req('GET', '/hospitals');
  if (!hospitals.items?.length) throw new Error('No hospitals returned');

  const patient = await login(accounts.patient);
  const doctor = await login(accounts.doctor);
  const admin = await login(accounts.admin);
  const reception = await login(accounts.reception);
  const nurse = await login(accounts.nurse);
  const pharmacy = await login(accounts.pharmacy);
  const lab = await login(accounts.lab);
  const superAdmin = await login(accounts.super);

  const me = await req('GET', '/auth/me', { token: patient.token });
  if (me.user.role !== 'PATIENT') throw new Error('Patient session invalid');

  const family = await req('GET', '/family', { token: patient.token });
  if (!Array.isArray(family.items)) throw new Error('Family list failed');

  const camps = await req('GET', '/health-camps');
  if (!camps.items?.length) throw new Error('Camps missing');
  await req('POST', `/health-camps/${camps.items[0]._id}/register`, { token: patient.token, body: {} });
  await req('GET', '/health-camps/mine', { token: patient.token });

  const doctors = await req('GET', '/doctors', { token: patient.token });
  const firstDoctor = doctors.items?.[0];
  if (!firstDoctor) throw new Error('No doctors available');
  const slots = await req('GET', `/doctors/${firstDoctor._id}/slots`, { token: patient.token });
  if (!Array.isArray(slots.available)) throw new Error('Slots failed');

  const appts = await req('GET', '/appointments', { token: patient.token });
  const existing = appts.items?.[0];
  if (existing) {
    await req('POST', `/appointments/${existing._id}/queue`, { token: patient.token, body: { priority: 'scheduled' } });
  }

  const patientId = patient.patient?._id;
  if (patientId) {
    await req('GET', `/patients/${patientId}?reason=Self+record+view`, { token: patient.token });
    await req('GET', `/patients/${patientId}/timeline`, { token: patient.token });
    await req('GET', `/emergency/${patient.patient.healthId}`);
    await req('GET', '/health-id', { token: patient.token });
  }

  await req('GET', '/billing/invoices', { token: patient.token });
  await req('GET', '/prescriptions', { token: patient.token });
  await req('GET', '/notifications', { token: patient.token });

  const doctorAppts = await req('GET', '/appointments', { token: doctor.token });
  const consultAppt = doctorAppts.items?.find((a) => ['in_queue', 'in_consult', 'confirmed', 'completed'].includes(a.status));
  if (consultAppt) {
    const started = await req('POST', `/consultations/start/${consultAppt._id}`, {
      token: doctor.token,
      body: { consentCaptured: true },
    });
    await req('POST', `/consultations/${started.consultation._id}/ai-draft`, {
      token: doctor.token,
      body: { transcript: 'Patient reports fever and cough for 3 days. Doctor: prescribe paracetamol two times a day for 3 days.' },
    });
  }
  await req('GET', '/analytics/doctor', { token: doctor.token });
  await req('GET', '/patients', { token: doctor.token });

  await req('GET', '/analytics/hospital', { token: admin.token });
  await req('GET', '/staff', { token: admin.token });
  await req('GET', '/beds', { token: admin.token });
  await req('GET', '/inventory', { token: admin.token });
  await req('GET', '/search?q=Rahul', { token: admin.token });

  await req('GET', '/patients', { token: reception.token });
  await req('GET', '/appointments', { token: reception.token });

  const nurseAppts = await req('GET', '/appointments', { token: nurse.token });
  if (nurseAppts.items?.[0]) {
    await req('POST', `/consultations/vitals/${nurseAppts.items[0]._id}`, {
      token: nurse.token,
      body: { vitals: { heartRate: 78, spo2: 98 }, nursingNotes: 'Ready for doctor' },
    });
  }

  await req('GET', '/pharmacy/orders', { token: pharmacy.token });
  await req('GET', '/pharmacy/medicines', { token: pharmacy.token });
  await req('GET', '/labs/orders', { token: lab.token });
  await req('GET', '/analytics/platform', { token: superAdmin.token });
  await req('GET', '/users', { token: superAdmin.token });
  await req('GET', '/plans', { token: superAdmin.token });
  await req('GET', `/queues/display/${hospitals.items[0]._id}`);

  console.log('All CareLink flows passed.');
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
