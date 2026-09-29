require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { connectDb } = require('../config/db');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const { LabTest, LabOrder, LabReport } = require('../models/Lab');
const { Medicine, PharmacyOrder } = require('../models/Pharmacy');
const { Invoice, Payment } = require('../models/Billing');
const { HealthCamp, CampRegistration } = require('../models/HealthCamp');
const { Ward, Room, Bed } = require('../models/Facility');
const Inventory = require('../models/Inventory');
const {
  Notification,
  Announcement,
  SubscriptionPlan,
  AuditLog,
  Feedback,
} = require('../models/Supporting');
const { generateHealthId, generateAppointmentCode, generateInvoiceNumber, generateTokenNumber } = require('../utils/healthId');

const FIRST = ['Rahul', 'Priya', 'Aarav', 'Anaya', 'Vikram', 'Meera', 'Kabir', 'Sana', 'Rohan', 'Isha', 'Arjun', 'Diya', 'Neel', 'Kavya', 'Aman', 'Nisha', 'Dev', 'Tara', 'Yash', 'Ria'];
const LAST = ['Sharma', 'Mehta', 'Iyer', 'Khan', 'Patel', 'Reddy', 'Nair', 'Das', 'Joshi', 'Gupta'];
const CITIES = ['Bengaluru', 'Mumbai', 'Pune'];

function pick(list, i) {
  return list[i % list.length];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function atHour(date, h, m = 0) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

async function reset() {
  const names = await mongoose.connection.db.listCollections().toArray();
  await Promise.all(names.map((c) => mongoose.connection.dropCollection(c.name).catch(() => {})));
}

async function run({ disconnect = true, resetFirst = true } = {}) {
  if (mongoose.connection.readyState === 0) {
    await connectDb();
  }
  console.log('Seeding CareLink...');
  if (resetFirst) await reset();

  const passwordHash = await User.hashPassword('Demo@12345');

  await SubscriptionPlan.insertMany([
    { code: 'STARTER', name: 'Starter', monthlyPrice: 4999, features: ['Patients', 'Appointments', 'Queue', 'Doctor dashboard', 'Basic reports'] },
    { code: 'PROFESSIONAL', name: 'Professional', monthlyPrice: 14999, features: ['Everything in Starter', 'AI documentation', 'Pharmacy', 'Laboratory', 'Billing', 'Analytics', 'Health camps'] },
    { code: 'ENTERPRISE', name: 'Enterprise', monthlyPrice: 39999, features: ['Everything', 'Multi-branch', 'Advanced analytics', 'Custom branding', 'Dedicated support'] },
  ]);

  const hospitals = await Hospital.insertMany([
    {
      name: 'City Care Hospital',
      slug: 'city-care',
      email: 'hello@citycare.health',
      phone: '08040001000',
      emergencyPhone: '108',
      address: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      branding: { displayName: 'CITY CARE HOSPITAL', primaryColor: '#0B1F3A', accentColor: '#0D9488' },
      subscription: { planCode: 'ENTERPRISE', status: 'active', seats: 120 },
      settings: { teleconsultEnabled: true, secondOpinionEnabled: true },
      announcement: 'Free diabetes screening camp this Sunday.',
    },
    {
      name: 'Lotus Multispeciality',
      slug: 'lotus-multi',
      email: 'care@lotus.health',
      phone: '02240002000',
      emergencyPhone: '108',
      address: { line1: '88 Linking Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
      branding: { displayName: 'LOTUS MULTISPECIALITY' },
      subscription: { planCode: 'PROFESSIONAL', status: 'active', seats: 60 },
    },
    {
      name: 'Sunrise Clinic Network',
      slug: 'sunrise-clinic',
      email: 'hi@sunrise.health',
      phone: '02040003000',
      emergencyPhone: '108',
      address: { line1: '5 FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
      branding: { displayName: 'SUNRISE CLINIC' },
      subscription: { planCode: 'STARTER', status: 'pending', seats: 15 },
    },
  ]);

  const [city, lotus] = hospitals;

  const superAdmin = await User.create({
    name: 'Aisha Kapoor',
    email: 'superadmin@carelink.health',
    phone: '9990000001',
    passwordHash,
    role: 'SUPER_ADMIN',
  });

  const cityAdmin = await User.create({
    name: 'Rakesh Menon',
    email: 'admin@citycare.health',
    phone: '9990000002',
    passwordHash,
    role: 'HOSPITAL_ADMIN',
    hospitalId: city._id,
  });

  const depts = await Department.insertMany([
    { hospitalId: city._id, name: 'General Medicine', code: 'GM', tokenPrefix: 'A', roomHint: '204' },
    { hospitalId: city._id, name: 'Cardiology', code: 'CAR', tokenPrefix: 'C', roomHint: '310' },
    { hospitalId: city._id, name: 'Pediatrics', code: 'PED', tokenPrefix: 'P', roomHint: '112' },
    { hospitalId: city._id, name: 'Orthopedics', code: 'ORT', tokenPrefix: 'O', roomHint: '208' },
    { hospitalId: city._id, name: 'Gynecology', code: 'GYN', tokenPrefix: 'G', roomHint: '215' },
    { hospitalId: city._id, name: 'Emergency', code: 'ER', tokenPrefix: 'E', roomHint: 'ER-1' },
    { hospitalId: lotus._id, name: 'General Medicine', code: 'GM', tokenPrefix: 'A', roomHint: '101' },
    { hospitalId: lotus._id, name: 'Dermatology', code: 'DER', tokenPrefix: 'D', roomHint: '102' },
  ]);

  const doctorDefs = [
    ['Amit Sharma', 'General Medicine', depts[0], '204', 12],
    ['Neha Rao', 'Cardiology', depts[1], '310', 18],
    ['Suresh Iyer', 'Pediatrics', depts[2], '112', 10],
    ['Kavita Desai', 'Orthopedics', depts[3], '208', 15],
    ['Farah Khan', 'Gynecology', depts[4], '215', 14],
    ['Vivek Nair', 'Emergency Medicine', depts[5], 'ER-1', 8],
    ['Anil Gupta', 'General Medicine', depts[0], '205', 13],
    ['Pooja Shah', 'Cardiology', depts[1], '311', 16],
    ['Ritu Bose', 'Pediatrics', depts[2], '113', 11],
    ['Manish Verma', 'Orthopedics', depts[3], '209', 14],
    ['Leela Krishnan', 'Gynecology', depts[4], '216', 15],
    ['Omar Siddiqui', 'Emergency Medicine', depts[5], 'ER-2', 9],
    ['Aditi Kulkarni', 'General Medicine', depts[0], '206', 12],
    ['Harsh Patel', 'Cardiology', depts[1], '312', 17],
    ['Sneha Das', 'Pediatrics', depts[2], '114', 10],
    ['Kiran Reddy', 'Orthopedics', depts[3], '210', 15],
    ['Maya Sen', 'Gynecology', depts[4], '217', 13],
    ['Nikhil Jain', 'General Medicine', depts[6], '101', 12],
    ['Rhea Kapur', 'Dermatology', depts[7], '102', 11],
    ['Sameer Bhat', 'General Medicine', depts[6], '103', 12],
  ];

  const doctors = [];
  for (let i = 0; i < doctorDefs.length; i += 1) {
    const [name, spec, dept, room, avg] = doctorDefs[i];
    const email = `${name.toLowerCase().replace(' ', '.')}@${dept.hospitalId.equals(city._id) ? 'citycare' : 'lotus'}.health`;
    const user = await User.create({
      name: `Dr. ${name}`,
      email,
      phone: `98${String(10000000 + i)}`,
      passwordHash,
      role: 'DOCTOR',
      hospitalId: dept.hospitalId,
    });
    const doc = await Doctor.create({
      userId: user._id,
      hospitalId: dept.hospitalId,
      departmentId: dept._id,
      specialization: spec,
      registrationNumber: `MCI-${20000 + i}`,
      qualification: 'MBBS, MD',
      experienceYears: 8 + (i % 15),
      consultationFee: 500 + (i % 5) * 200,
      roomNumber: room,
      avgConsultationMinutes: avg,
      status: i % 7 === 0 ? 'busy' : 'available',
      bio: `${spec} consultant with a focus on clear communication and continuity of care.`,
    });
    doctors.push(doc);
  }

  const sharma = doctors[0];

  const staffUsers = await User.insertMany([
    { name: 'Reception Desk', email: 'reception@citycare.health', phone: '9990000010', passwordHash, role: 'RECEPTIONIST', hospitalId: city._id },
    { name: 'Nurse Anita', email: 'nurse@citycare.health', phone: '9990000011', passwordHash, role: 'NURSE', hospitalId: city._id },
    { name: 'Pharmacist Dev', email: 'pharmacy@citycare.health', phone: '9990000012', passwordHash, role: 'PHARMACIST', hospitalId: city._id },
    { name: 'Lab Tech Riya', email: 'lab@citycare.health', phone: '9990000013', passwordHash, role: 'LAB_TECHNICIAN', hospitalId: city._id },
  ]);
  await Staff.insertMany(staffUsers.map((u, i) => ({
    userId: u._id,
    hospitalId: city._id,
    departmentId: depts[0]._id,
    staffType: u.role,
    employeeCode: `STF-0${i + 1}`,
    shift: 'morning',
  })));

  const patientUsers = [];
  for (let i = 0; i < 500; i += 1) {
    patientUsers.push({
      name: `${pick(FIRST, i)} ${pick(LAST, i + 3)}`,
      email: i === 0 ? 'rahul@demo.health' : `patient${i}@demo.health`,
      phone: `90${String(10000000 + i)}`,
      passwordHash,
      role: 'PATIENT',
    });
  }
  const createdUsers = await User.insertMany(patientUsers, { ordered: true });
  const patientDocs = createdUsers.map((user, i) => ({
    userId: user._id,
    healthId: generateHealthId(),
    hospitalIds: [i % 17 === 0 ? lotus._id : city._id],
    primaryHospitalId: i % 17 === 0 ? lotus._id : city._id,
    gender: i % 2 === 0 ? 'male' : 'female',
    dateOfBirth: new Date(1985 + (i % 30), i % 12, (i % 27) + 1),
    bloodGroup: pick(['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'], i),
    address: { line1: `${i + 12} Park Street`, city: pick(CITIES, i), state: 'India', pincode: '5600' + (i % 10) },
    emergencyContact: { name: 'Family Contact', phone: '9811100110', relation: 'Spouse' },
    medical: {
      allergies: i % 9 === 0 ? ['Penicillin'] : [],
      conditions: i % 11 === 0 ? ['Hypertension'] : i % 13 === 0 ? ['Type 2 Diabetes'] : [],
      currentMedications: i % 11 === 0 ? ['Amlodipine 5mg'] : [],
      immunizations: i % 20 === 0 ? [{ name: 'Influenza', dueDate: daysAgo(-20), status: 'due' }] : [],
      alerts: i % 9 === 0 ? ['Drug allergy'] : [],
    },
  }));
  const patients = await Patient.insertMany(patientDocs);

  const rahul = patients[0];
  await FamilyMember.insertMany([
    { ownerPatientId: rahul._id, name: 'Priya Sharma', relationship: 'Spouse', gender: 'female', dateOfBirth: new Date(1994, 4, 12), healthId: generateHealthId() },
    { ownerPatientId: rahul._id, name: 'Anaya Sharma', relationship: 'Daughter', gender: 'female', dateOfBirth: new Date(2018, 9, 3), healthId: generateHealthId() },
    { ownerPatientId: rahul._id, name: 'Suresh Sharma', relationship: 'Father', gender: 'male', dateOfBirth: new Date(1958, 1, 20), healthId: generateHealthId() },
    { ownerPatientId: rahul._id, name: 'Lata Sharma', relationship: 'Mother', gender: 'female', dateOfBirth: new Date(1961, 6, 8), healthId: generateHealthId() },
  ]);

  const tests = await LabTest.insertMany([
    { hospitalId: city._id, name: 'CBC', code: 'CBC', category: 'Hematology', price: 450, sampleType: 'Blood', referenceRanges: [{ analyte: 'Hemoglobin', unit: 'g/dL', low: 12, high: 16 }] },
    { hospitalId: city._id, name: 'Fasting Blood Sugar', code: 'FBS', category: 'Biochemistry', price: 180, sampleType: 'Blood', referenceRanges: [{ analyte: 'Glucose', unit: 'mg/dL', low: 70, high: 100 }] },
    { hospitalId: city._id, name: 'Lipid Profile', code: 'LIP', category: 'Biochemistry', price: 700, sampleType: 'Blood', referenceRanges: [{ analyte: 'LDL', unit: 'mg/dL', low: 0, high: 100 }] },
    { hospitalId: city._id, name: 'Thyroid Profile', code: 'TFT', category: 'Endocrine', price: 650, sampleType: 'Blood', referenceRanges: [{ analyte: 'TSH', unit: 'mIU/L', low: 0.4, high: 4.0 }] },
  ]);

  await Medicine.insertMany([
    { hospitalId: city._id, name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'Analgesic', batchNumber: 'B1021', expiryDate: daysAgo(-400), quantity: 420, reorderLevel: 80, unitPrice: 12, supplier: 'MediSource' },
    { hospitalId: city._id, name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', batchNumber: 'B2044', expiryDate: daysAgo(-200), quantity: 18, reorderLevel: 40, unitPrice: 28, supplier: 'MediSource' },
    { hospitalId: city._id, name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiac', batchNumber: 'B3310', expiryDate: daysAgo(-360), quantity: 90, reorderLevel: 30, unitPrice: 18, supplier: 'CarePharma' },
  ]);

  const wards = await Ward.insertMany([
    { hospitalId: city._id, name: 'General Ward A', building: 'Block A', floor: '2', type: 'general' },
    { hospitalId: city._id, name: 'ICU', building: 'Block B', floor: '1', type: 'icu' },
    { hospitalId: city._id, name: 'Maternity', building: 'Block C', floor: '3', type: 'maternity' },
  ]);
  const rooms = [];
  for (let i = 0; i < 12; i += 1) {
    rooms.push(await Room.create({ hospitalId: city._id, wardId: wards[i % 3]._id, number: `${200 + i}`, type: 'standard' }));
  }
  for (let i = 0; i < 80; i += 1) {
    const status = i < 54 ? 'occupied' : i < 62 ? 'reserved' : i < 70 ? 'maintenance' : 'available';
    await Bed.create({
      hospitalId: city._id,
      wardId: wards[i % 3]._id,
      roomId: rooms[i % rooms.length]._id,
      number: `B-${i + 1}`,
      status,
      patientId: status === 'occupied' ? patients[i]._id : undefined,
    });
  }

  await Inventory.insertMany([
    { hospitalId: city._id, name: 'N95 Masks', category: 'ppe', sku: 'PPE-N95', quantity: 40, reorderLevel: 100, unit: 'box', supplier: 'SafeMed' },
    { hospitalId: city._id, name: 'Surgical Gloves', category: 'consumable', sku: 'CON-GLV', quantity: 12, reorderLevel: 50, unit: 'box', expiryDate: daysAgo(-20) },
    { hospitalId: city._id, name: 'ECG Machine', category: 'equipment', sku: 'EQ-ECG', quantity: 4, reorderLevel: 1, unit: 'unit' },
  ]);

  const today = new Date();
  const appointments = [];
  for (let i = 0; i < 40; i += 1) {
    const doctor = doctors[i % 8];
    const patient = patients[i];
    const slot = atHour(today, 9 + Math.floor(i / 4), (i % 4) * 15);
    const token = generateTokenNumber(depts.find((d) => d._id.equals(doctor.departmentId))?.tokenPrefix || 'A', 20 + i);
    const appointment = await Appointment.create({
      code: generateAppointmentCode(),
      hospitalId: doctor.hospitalId,
      patientId: patient._id,
      doctorId: doctor._id,
      departmentId: doctor.departmentId,
      type: i % 9 === 0 ? 'FOLLOW_UP' : 'OPD',
      slotStart: slot,
      status: i < 8 ? 'completed' : i < 12 ? 'in_consult' : i < 28 ? 'in_queue' : 'confirmed',
      priority: i === 14 ? 'emergency' : i % 10 === 0 ? 'senior' : 'scheduled',
      token,
      roomNumber: doctor.roomNumber,
    });
    appointment.passQr = await QRCode.toDataURL(JSON.stringify({ type: 'appointment-pass', code: appointment.code, token }));
    await appointment.save();
    appointments.push(appointment);
  }

  const sharmaAppts = appointments.filter((a) => a.doctorId.equals(sharma._id));
  const queue = await Queue.create({
    hospitalId: city._id,
    doctorId: sharma._id,
    departmentId: sharma.departmentId,
    date: today.toISOString().slice(0, 10),
    currentToken: 'A-37',
    nextToken: 'A-38',
    roomNumber: '204',
    doctorStatus: 'available',
    avgMinutes: 12,
    items: sharmaAppts.slice(0, 12).map((a, idx) => ({
      appointmentId: a._id,
      patientId: a.patientId,
      token: a.token,
      priority: a.priority,
      status: idx === 0 ? 'serving' : idx < 3 ? 'completed' : 'waiting',
      arrivedAt: new Date(),
    })),
  });
  if (queue.items[0]) queue.currentToken = queue.items[0].token;
  await queue.save();

  for (let i = 0; i < 8; i += 1) {
    const appt = appointments[i];
    const consult = await Consultation.create({
      appointmentId: appt._id,
      hospitalId: appt.hospitalId,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      departmentId: appt.departmentId,
      status: 'completed',
      consentCaptured: true,
      complaints: ['Fever', 'Cough'],
      history: { duration: '3 days', onset: 'Gradual' },
      examination: 'Throat congested. Chest clear.',
      assessment: 'Viral upper respiratory infection. Clinical impression only after doctor review.',
      diagnosis: ['URTI'],
      clinicalNotes: 'Advised rest and hydration.',
      vitals: { bloodPressure: '118/76', heartRate: 82, temperature: 99.2, spo2: 98, weight: 72, height: 170 },
      followUpDate: daysAgo(-7),
      followUpNote: 'Follow-up recommended after 7 days.',
      completedAt: daysAgo(i + 1),
    });
    const rx = await Prescription.create({
      consultationId: consult._id,
      hospitalId: appt.hospitalId,
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      medicines: [{ name: 'Paracetamol', dosage: 'As prescribed by doctor', frequency: '2 times/day', duration: '3 days' }],
      tests: i % 2 === 0 ? ['CBC'] : [],
      instructions: 'Take after food. Rest well.',
      followUp: 'Follow-up after 7 days',
      status: i < 3 ? 'dispensed' : 'issued',
    });
    if (i % 2 === 0) {
      const order = await LabOrder.create({
        hospitalId: city._id,
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        consultationId: consult._id,
        tests: [tests[0]._id],
        status: 'released',
        sampleCode: `SMP-10${i}`,
      });
      await LabReport.create({
        hospitalId: city._id,
        orderId: order._id,
        patientId: appt.patientId,
        results: [
          { analyte: 'Hemoglobin', value: 12.1 + i * 0.3, unit: 'g/dL', low: 12, high: 16, abnormal: false },
        ],
      });
    }
    await PharmacyOrder.create({
      hospitalId: city._id,
      patientId: appt.patientId,
      prescriptionId: rx._id,
      items: [{ name: 'Paracetamol 500mg', quantity: 10, unitPrice: 12 }],
      status: i < 3 ? 'dispensed' : 'queued',
      total: 120,
    });
    const invoice = await Invoice.create({
      number: generateInvoiceNumber() + i,
      hospitalId: city._id,
      patientId: appt.patientId,
      appointmentId: appt._id,
      items: [
        { type: 'consultation', description: 'OPD consultation', amount: 500 },
        { type: 'pharmacy', description: 'Medicines', amount: 120 },
      ],
      subtotal: 620,
      total: 620,
      paid: i < 5 ? 620 : 0,
      status: i < 5 ? 'paid' : 'unpaid',
    });
    if (i < 5) {
      await Payment.create({
        invoiceId: invoice._id,
        hospitalId: city._id,
        patientId: appt.patientId,
        amount: 620,
        method: 'upi',
        receiptNumber: `RCT-10${i}`,
      });
    }
  }

  const camps = await HealthCamp.insertMany([
    {
      hospitalId: city._id,
      title: 'Free Diabetes Checkup',
      description: 'Fasting sugar and consultation with an endocrinology-trained physician.',
      category: 'Diabetes',
      date: daysAgo(-4),
      startTime: '09:00',
      endTime: '13:00',
      location: 'City Care Hospital, Ground Floor',
      doctors: [sharma._id],
      slots: 80,
      registered: 24,
      eligibility: 'Adults 18+',
      services: ['FBS', 'Doctor consult'],
      status: 'open',
    },
    {
      hospitalId: city._id,
      title: 'Free Eye Checkup',
      description: 'Vision screening and refraction.',
      category: 'Eye',
      date: daysAgo(-3),
      startTime: '10:00',
      endTime: '14:00',
      location: 'City Care Outreach Hall',
      slots: 60,
      registered: 18,
      eligibility: 'All ages',
      services: ['Vision test'],
      status: 'open',
    },
    {
      hospitalId: city._id,
      title: 'Heart Health Screening',
      description: 'BP, ECG and lifestyle counselling.',
      category: 'Cardiac',
      date: daysAgo(-11),
      startTime: '09:00',
      endTime: '13:00',
      location: 'City Care Cardiology Wing',
      doctors: [doctors[1]._id],
      slots: 50,
      registered: 12,
      eligibility: 'Adults 30+',
      services: ['BP', 'ECG'],
      status: 'open',
    },
  ]);

  await CampRegistration.create({
    campId: camps[0]._id,
    patientId: rahul._id,
    qrCode: await QRCode.toDataURL(JSON.stringify({ type: 'camp', campId: camps[0]._id })),
    status: 'confirmed',
  });

  await Notification.insertMany([
    { hospitalId: city._id, userId: (await User.findOne({ email: 'rahul@demo.health' }))._id, patientId: rahul._id, category: 'queue', title: 'Your turn is approaching', body: '3 patients are ahead of you. You can arrive about 20 minutes before your estimated turn.' },
    { hospitalId: city._id, userId: (await User.findOne({ email: 'rahul@demo.health' }))._id, patientId: rahul._id, category: 'appointment', title: 'Appointment tomorrow', body: 'Your appointment with Dr. Amit Sharma is tomorrow at 10:30 AM.' },
    { hospitalId: city._id, userId: (await User.findOne({ email: 'rahul@demo.health' }))._id, patientId: rahul._id, category: 'healthCamp', title: 'Free diabetes camp', body: 'Free diabetes screening camp this Sunday, 9 AM–1 PM.' },
  ]);

  await Announcement.create({
    hospitalId: city._id,
    title: 'OPD timing update',
    body: 'General Medicine OPD will open at 8:30 AM tomorrow.',
    audience: 'all',
    createdBy: cityAdmin._id,
  });

  await Feedback.create({
    hospitalId: city._id,
    patientId: rahul._id,
    doctorId: sharma._id,
    appointmentExperience: 5,
    waitingExperience: 4,
    hospitalService: 5,
    doctorCommunication: 5,
    staffExperience: 4,
    comment: 'Clear instructions and a calm waiting experience.',
  });

  await AuditLog.create({
    hospitalId: city._id,
    actorId: (await User.findOne({ email: 'amit.sharma@citycare.health' }))._id,
    actorName: 'Dr. Amit Sharma',
    actorRole: 'DOCTOR',
    action: 'view_patient',
    resource: 'Patient',
    resourceId: rahul._id,
    reason: 'Consultation',
  });

  console.log('Seed complete.');
  console.log('--- Demo logins (password: Demo@12345) ---');
  console.log('Super Admin   superadmin@carelink.health');
  console.log('Hospital Admin admin@citycare.health');
  console.log('Doctor         amit.sharma@citycare.health');
  console.log('Patient        rahul@demo.health');
  console.log('Reception      reception@citycare.health');
  console.log('Nurse          nurse@citycare.health');
  console.log('Pharmacy       pharmacy@citycare.health');
  console.log('Lab            lab@citycare.health');
  if (disconnect) await mongoose.disconnect();
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { run };
