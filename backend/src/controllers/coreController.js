const Hospital = require('../models/Hospital');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');
const FamilyMember = require('../models/FamilyMember');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Queue = require('../models/Queue');
const { LabTest, LabOrder, LabReport } = require('../models/Lab');
const { Medicine, PharmacyOrder } = require('../models/Pharmacy');
const { Invoice, Payment } = require('../models/Billing');
const { HealthCamp, CampRegistration } = require('../models/HealthCamp');
const { Ward, Room, Bed } = require('../models/Facility');
const Inventory = require('../models/Inventory');
const {
  Notification,
  DocumentFile,
  Referral,
  Feedback,
  AuditLog,
  Announcement,
  SupportTicket,
  SubscriptionPlan,
  SecondOpinion,
} = require('../models/Supporting');
const { generateAppointmentCode, generateInvoiceNumber, generateHealthId, generateTokenNumber } = require('../utils/healthId');
const { tenantQuery } = require('../utils/scope');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const queueService = require('../services/queueService');
const { notify } = require('../services/notificationService');
const { generateDraft } = require('../services/aiService');
const QRCode = require('qrcode');

const paginate = (req) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  return { page, limit, skip: (page - 1) * limit };
};

async function paged(model, query, req, populate) {
  const { page, limit, skip } = paginate(req);
  const q = model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
  if (populate) q.populate(populate);
  const [items, total] = await Promise.all([q, model.countDocuments(query)]);
  return { items, total, page, pages: Math.ceil(total / limit) };
}

const listHospitals = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.city) q['address.city'] = new RegExp(req.query.city, 'i');
  if (req.query.q) q.name = new RegExp(req.query.q, 'i');
  if (req.user?.role !== 'SUPER_ADMIN') q['subscription.status'] = 'active';
  const result = await paged(Hospital, q, req);
  res.json({ success: true, ...result });
});

const getHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) throw new ApiError(404, 'Hospital not found');
  const departments = await Department.find({ hospitalId: hospital._id });
  const doctors = await Doctor.find({ hospitalId: hospital._id }).populate('userId', 'name email phone').populate('departmentId');
  res.json({ success: true, hospital, departments, doctors });
});

const upsertHospital = asyncHandler(async (req, res) => {
  const hospital = req.params.id
    ? await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true })
    : await Hospital.create(req.body);
  res.json({ success: true, hospital });
});

const approveHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    { 'subscription.status': req.body.status, approvedAt: new Date() },
    { new: true }
  );
  res.json({ success: true, hospital });
});

const listDoctors = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.hospitalId) query.hospitalId = req.query.hospitalId;
  if (req.query.departmentId) query.departmentId = req.query.departmentId;
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.hospitalId) query.hospitalId = req.user.hospitalId;
  const result = await paged(Doctor, query, req, ['userId', 'departmentId', 'hospitalId']);
  res.json({ success: true, ...result });
});

const listPatients = asyncHandler(async (req, res) => {
  const query = tenantQuery(req);
  if (req.query.q) {
    const users = await User.find({
      role: 'PATIENT',
      $or: [
        { name: new RegExp(req.query.q, 'i') },
        { phone: new RegExp(req.query.q, 'i') },
        { email: new RegExp(req.query.q, 'i') },
      ],
    }).select('_id');
    query.$or = [{ userId: { $in: users.map((u) => u._id) } }, { healthId: new RegExp(req.query.q, 'i') }];
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    query.hospitalIds = req.user.hospitalId;
    delete query.hospitalId;
  }
  const result = await paged(Patient, query, req, ['userId']);
  res.json({ success: true, ...result });
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate('userId');
  if (!patient) throw new ApiError(404, 'Patient not found');
  if (req.user.role === 'PATIENT' && String(patient.userId._id || patient.userId) !== String(req.user._id)) {
    throw new ApiError(403, 'Not allowed');
  }
  const [family, appointments, consultations, prescriptions, reports, invoices, documents] = await Promise.all([
    FamilyMember.find({ ownerPatientId: patient._id }),
    Appointment.find({ patientId: patient._id }).sort({ slotStart: -1 }).limit(20).populate('doctorId departmentId hospitalId'),
    Consultation.find({ patientId: patient._id, status: { $in: ['approved', 'completed'] } }).sort({ createdAt: -1 }).populate('doctorId departmentId'),
    Prescription.find({ patientId: patient._id }).sort({ createdAt: -1 }),
    LabReport.find({ patientId: patient._id }).sort({ createdAt: -1 }),
    Invoice.find({ patientId: patient._id }).sort({ createdAt: -1 }),
    DocumentFile.find({ patientId: patient._id }).sort({ createdAt: -1 }),
  ]);
  await AuditLog.create({
    hospitalId: req.user.hospitalId,
    actorId: req.user._id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'view_patient',
    resource: 'Patient',
    resourceId: patient._id,
    reason: req.query.reason || 'Record access',
  });
  res.json({ success: true, patient, family, appointments, consultations, prescriptions, reports, invoices, documents });
});

const createWalkIn = asyncHandler(async (req, res) => {
  let user = await User.findOne({ $or: [{ phone: req.body.phone }, { email: req.body.email }] });
  if (!user) {
    user = await User.create({
      name: req.body.name,
      email: req.body.email || `${req.body.phone}@walkin.carelink`,
      phone: req.body.phone,
      passwordHash: await User.hashPassword('WalkIn@12345'),
      role: 'PATIENT',
    });
  }
  let patient = await Patient.findOne({ userId: user._id });
  if (!patient) {
    patient = await Patient.create({
      userId: user._id,
      healthId: generateHealthId(),
      hospitalIds: [req.user.hospitalId],
      primaryHospitalId: req.user.hospitalId,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
    });
  } else if (!patient.hospitalIds.some((id) => String(id) === String(req.user.hospitalId))) {
    patient.hospitalIds.push(req.user.hospitalId);
    await patient.save();
  }
  res.status(201).json({ success: true, user, patient });
});

const familyMembers = {
  list: asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) throw new ApiError(404, 'Patient profile not found');
    const items = await FamilyMember.find({ ownerPatientId: patient._id });
    res.json({ success: true, items });
  }),
  create: asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) throw new ApiError(404, 'Patient profile not found');
    const member = await FamilyMember.create({
      ...req.body,
      ownerPatientId: patient._id,
      healthId: generateHealthId(),
    });
    res.status(201).json({ success: true, member });
  }),
};

const slots = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.doctorId || req.query.doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const date = req.query.date || queueService.todayKey();
  const start = new Date(`${date}T09:00:00`);
  const end = new Date(`${date}T17:00:00`);
  const existing = await Appointment.find({
    doctorId: doctor._id,
    slotStart: { $gte: start, $lt: end },
    status: { $nin: ['cancelled', 'no_show'] },
  });
  const taken = new Set(existing.map((a) => a.slotStart.toISOString()));
  const duration = doctor.slotDuration || 15;
  const buffer = doctor.bufferTime || 5;
  const available = [];
  for (let t = start.getTime(); t < end.getTime(); t += (duration + buffer) * 60000) {
    const slot = new Date(t);
    if (!taken.has(slot.toISOString())) {
      available.push(slot.toISOString());
    }
  }
  res.json({ success: true, available, duration, buffer });
});

const createAppointment = asyncHandler(async (req, res) => {
  const patient = req.body.patientId
    ? await Patient.findById(req.body.patientId)
    : await Patient.findOne({ userId: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient not found');
  const doctor = await Doctor.findById(req.body.doctorId);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const slotStart = new Date(req.body.slotStart);
  const clash = await Appointment.findOne({
    doctorId: doctor._id,
    slotStart,
    status: { $nin: ['cancelled', 'no_show'] },
  });
  if (clash) throw new ApiError(409, 'This slot is no longer available');
  const department = await Department.findById(doctor.departmentId);
  const token = generateTokenNumber(department?.tokenPrefix || 'A', Math.floor(Math.random() * 80) + 10);
  const appointment = await Appointment.create({
    code: generateAppointmentCode(),
    hospitalId: doctor.hospitalId,
    patientId: patient._id,
    familyMemberId: req.body.familyMemberId,
    doctorId: doctor._id,
    departmentId: doctor.departmentId,
    type: req.body.type || 'OPD',
    slotStart,
    slotEnd: new Date(slotStart.getTime() + (doctor.slotDuration || 15) * 60000),
    status: 'confirmed',
    priority: req.body.priority || 'scheduled',
    token,
    roomNumber: doctor.roomNumber,
    source: req.user.role === 'PATIENT' ? 'patient' : 'reception',
    notes: req.body.notes,
  });
  appointment.passQr = await QRCode.toDataURL(JSON.stringify({
    type: 'appointment-pass',
    code: appointment.code,
    token,
  }));
  await appointment.save();
  await notify({
    hospitalId: doctor.hospitalId,
    userId: patient.userId,
    patientId: patient._id,
    category: 'appointment',
    title: 'Appointment confirmed',
    body: `Your appointment is confirmed. Token ${token}.`,
  });
  const populated = await Appointment.findById(appointment._id).populate('doctorId departmentId hospitalId patientId');
  res.status(201).json({ success: true, appointment: populated });
});

const listAppointments = asyncHandler(async (req, res) => {
  const query = {};
  if (req.user.role === 'PATIENT') {
    const patient = await Patient.findOne({ userId: req.user._id });
    query.patientId = patient?._id;
  } else if (req.user.role === 'DOCTOR') {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    query.doctorId = doctor?._id;
  } else if (req.user.role !== 'SUPER_ADMIN') {
    query.hospitalId = req.user.hospitalId;
  }
  if (req.query.date) {
    const start = new Date(`${req.query.date}T00:00:00`);
    const end = new Date(`${req.query.date}T23:59:59`);
    query.slotStart = { $gte: start, $lte: end };
  }
  if (req.query.status) query.status = req.query.status;
  const result = await paged(Appointment, query, req, ['patientId', 'doctorId', 'departmentId', 'hospitalId']);
  const items = await Appointment.populate(result.items, { path: 'patientId', populate: { path: 'userId', select: 'name phone' } });
  const doctors = await Doctor.populate(items, { path: 'doctorId', populate: { path: 'userId', select: 'name' } });
  res.json({ success: true, ...result, items: doctors });
});

const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, appointment });
});

const joinQueue = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  const { queue, item } = await queueService.enqueueAppointment(appointment, req.body.priority || appointment.priority);
  const view = queueService.decorateQueue(queue, item.token);
  if (req.app.get('io')) {
    req.app.get('io').to(`queue:${queue._id}`).emit('queue:update', view);
    req.app.get('io').to(`hospital:${queue.hospitalId}`).emit('queue:update', view);
  }
  res.json({ success: true, ...view, token: item.token });
});

const getQueue = asyncHandler(async (req, res) => {
  const query = { doctorId: req.params.doctorId, date: req.query.date || queueService.todayKey() };
  if (req.user?.hospitalId) query.hospitalId = req.user.hospitalId;
  const queue = await Queue.findOne(query).populate('items.patientId');
  if (!queue) return res.json({ success: true, queue: null, waitingCount: 0 });
  res.json({ success: true, ...queueService.decorateQueue(queue, req.query.token) });
});

const displayQueue = asyncHandler(async (req, res) => {
  const queues = await Queue.find({
    hospitalId: req.params.hospitalId,
    date: req.query.date || queueService.todayKey(),
  }).populate('doctorId departmentId');
  const populated = await Doctor.populate(queues, {
    path: 'doctorId',
    populate: [
      { path: 'userId', select: 'name' },
      { path: 'hospitalId', select: 'name branding' },
    ],
  });
  res.json({ success: true, queues: populated.map((q) => ({ ...queueService.decorateQueue(q), doctor: q.doctorId, department: q.departmentId })) });
});

const advanceQueue = asyncHandler(async (req, res) => {
  const queue = await queueService.callNext(req.params.id);
  if (!queue) throw new ApiError(404, 'Queue not found');
  const view = queueService.decorateQueue(queue);
  if (req.app.get('io')) {
    req.app.get('io').to(`queue:${queue._id}`).emit('queue:update', view);
    req.app.get('io').to(`hospital:${queue.hospitalId}`).emit('queue:update', view);
  }
  const serving = queue.items.find((item) => item.status === 'serving');
  if (serving) {
    const appointment = await Appointment.findById(serving.appointmentId).populate('patientId');
    if (appointment?.patientId) {
      await notify({
        hospitalId: queue.hospitalId,
        userId: appointment.patientId.userId,
        patientId: appointment.patientId._id,
        category: 'queue',
        title: 'Your turn',
        body: `Please proceed to room ${queue.roomNumber}. Now serving ${queue.currentToken}.`,
      });
    }
  }
  res.json({ success: true, ...view });
});

const startConsultation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  let consultation = await Consultation.findOne({ appointmentId: appointment._id });
  if (!consultation) {
    consultation = await Consultation.create({
      appointmentId: appointment._id,
      hospitalId: appointment.hospitalId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      departmentId: appointment.departmentId,
      status: 'in_progress',
      consentCaptured: !!req.body.consentCaptured,
      startedAt: new Date(),
    });
  }
  appointment.status = 'in_consult';
  await appointment.save();
  res.json({ success: true, consultation });
});

const updateConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, consultation });
});

const aiDraft = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) throw new ApiError(404, 'Consultation not found');
  if (!consultation.consentCaptured) throw new ApiError(400, 'Patient consent is required before AI drafting');
  const draft = await generateDraft({
    transcript: req.body.transcript || '',
    clinicianNotes: req.body.clinicianNotes || consultation.clinicalNotes || '',
  });
  consultation.aiDraft = draft;
  consultation.status = 'pending_review';
  await consultation.save();
  res.json({ success: true, draft, disclaimer: draft.disclaimer });
});

const approveConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) throw new ApiError(404, 'Consultation not found');
  Object.assign(consultation, req.body.record || {});
  consultation.status = 'completed';
  consultation.approvedAt = new Date();
  consultation.completedAt = new Date();
  if (consultation.aiDraft) consultation.aiDraft.reviewed = true;
  await consultation.save();

  if (req.body.medicines?.length) {
    await Prescription.create({
      consultationId: consultation._id,
      hospitalId: consultation.hospitalId,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      medicines: req.body.medicines,
      tests: req.body.tests || [],
      instructions: req.body.instructions,
      followUp: req.body.followUp,
      status: 'issued',
    });
    if (req.body.medicines.length) {
      await PharmacyOrder.create({
        hospitalId: consultation.hospitalId,
        patientId: consultation.patientId,
        prescriptionId: (await Prescription.findOne({ consultationId: consultation._id }))._id,
        items: req.body.medicines.map((m) => ({ name: m.name, quantity: 1, unitPrice: 0 })),
        status: 'queued',
      });
    }
  }

  if (req.body.tests?.length) {
    const catalog = await LabTest.find({ hospitalId: consultation.hospitalId, name: { $in: req.body.tests } });
    await LabOrder.create({
      hospitalId: consultation.hospitalId,
      patientId: consultation.patientId,
      doctorId: consultation.doctorId,
      consultationId: consultation._id,
      tests: catalog.map((t) => t._id),
      status: 'ordered',
      sampleCode: `SMP-${Date.now().toString().slice(-6)}`,
    });
  }

  if (consultation.followUpDate) {
    await notify({
      hospitalId: consultation.hospitalId,
      patientId: consultation.patientId,
      category: 'followUp',
      title: 'Follow-up recommended',
      body: 'Your doctor recommended a follow-up visit. Would you like to book it?',
      metadata: { followUpDate: consultation.followUpDate },
    });
  }

  await Appointment.findByIdAndUpdate(consultation.appointmentId, { status: 'completed' });
  const invoice = await Invoice.create({
    number: generateInvoiceNumber(),
    hospitalId: consultation.hospitalId,
    patientId: consultation.patientId,
    appointmentId: consultation.appointmentId,
    items: [{ type: 'consultation', description: 'OPD consultation', amount: req.body.fee || 500 }],
    subtotal: req.body.fee || 500,
    total: req.body.fee || 500,
    status: 'unpaid',
  });

  res.json({ success: true, consultation, invoice });
});

const timeline = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  const [consultations, prescriptions, reports, appointments] = await Promise.all([
    Consultation.find({ patientId, status: { $in: ['approved', 'completed'] } }).populate('departmentId doctorId'),
    Prescription.find({ patientId }),
    LabReport.find({ patientId }),
    Appointment.find({ patientId, type: 'HEALTH_CAMP' }),
  ]);
  const events = [
    ...consultations.map((c) => ({
      type: 'consultation',
      date: c.completedAt || c.createdAt,
      title: c.departmentId?.name || 'Consultation',
      subtitle: (c.complaints || []).join(', '),
      data: c,
    })),
    ...prescriptions.map((p) => ({
      type: 'prescription',
      date: p.createdAt,
      title: 'Prescription',
      subtitle: p.medicines.map((m) => m.name).join(', '),
      data: p,
    })),
    ...reports.map((r) => ({
      type: 'lab',
      date: r.createdAt,
      title: 'Lab report',
      subtitle: r.results.map((x) => x.analyte).join(', '),
      data: r,
    })),
    ...appointments.map((a) => ({
      type: 'camp',
      date: a.slotStart,
      title: 'Health camp',
      subtitle: a.notes,
      data: a,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ success: true, events });
});

const analyticsHospital = asyncHandler(async (req, res) => {
  let hospitalId = req.user.role === 'SUPER_ADMIN' ? req.query.hospitalId : req.user.hospitalId;
  if (!hospitalId) {
    const first = await Hospital.findOne({ 'subscription.status': 'active' });
    if (!first) {
      return res.json({
        success: true,
        cards: {
          totalPatients: 0,
          todayPatients: 0,
          todayAppointments: 0,
          todayCompleted: 0,
          activeQueues: 0,
          doctorsAvailable: 0,
          bedOccupancy: 0,
          todayRevenue: 0,
          beds: { total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 },
        },
        trend: [],
      });
    }
    hospitalId = first._id;
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [
    totalPatients,
    todayAppointments,
    todayCompleted,
    queues,
    doctors,
    beds,
    invoices,
  ] = await Promise.all([
    Patient.countDocuments({ hospitalIds: hospitalId }),
    Appointment.countDocuments({ hospitalId, slotStart: { $gte: start } }),
    Appointment.countDocuments({ hospitalId, slotStart: { $gte: start }, status: 'completed' }),
    Queue.countDocuments({ hospitalId, date: queueService.todayKey() }),
    Doctor.countDocuments({ hospitalId, status: { $ne: 'offline' } }),
    Bed.find({ hospitalId }),
    Invoice.find({ hospitalId, createdAt: { $gte: start } }),
  ]);
  const revenue = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  const occupancy = beds.length ? Math.round((beds.filter((b) => b.status === 'occupied').length / beds.length) * 100) : 0;
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    days.push({
      date: d.toISOString().slice(0, 10),
      patients: await Appointment.countDocuments({ hospitalId, slotStart: { $gte: d, $lt: next } }),
      revenue: (await Invoice.find({ hospitalId, createdAt: { $gte: d, $lt: next } })).reduce((s, inv) => s + (inv.paid || 0), 0),
    });
  }
  res.json({
    success: true,
    cards: {
      totalPatients,
      todayPatients: todayAppointments,
      todayAppointments,
      todayCompleted,
      activeQueues: queues,
      doctorsAvailable: doctors,
      bedOccupancy: occupancy,
      todayRevenue: revenue,
      beds: {
        total: beds.length,
        available: beds.filter((b) => b.status === 'available').length,
        occupied: beds.filter((b) => b.status === 'occupied').length,
        reserved: beds.filter((b) => b.status === 'reserved').length,
        maintenance: beds.filter((b) => b.status === 'maintenance').length,
      },
    },
    trend: days,
  });
});

const analyticsPlatform = asyncHandler(async (req, res) => {
  const [hospitals, doctors, patients, invoices] = await Promise.all([
    Hospital.countDocuments(),
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Invoice.find({}),
  ]);
  res.json({
    success: true,
    cards: {
      hospitals,
      doctors,
      patients,
      revenue: invoices.reduce((s, i) => s + (i.paid || 0), 0),
    },
  });
});

const analyticsDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const week = new Date();
  week.setDate(week.getDate() - 7);
  const month = new Date();
  month.setDate(month.getDate() - 30);
  const [today, weekly, monthly, completed, noShows] = await Promise.all([
    Appointment.countDocuments({ doctorId: doctor._id, slotStart: { $gte: start } }),
    Appointment.countDocuments({ doctorId: doctor._id, slotStart: { $gte: week } }),
    Appointment.countDocuments({ doctorId: doctor._id, slotStart: { $gte: month } }),
    Appointment.countDocuments({ doctorId: doctor._id, status: 'completed', slotStart: { $gte: month } }),
    Appointment.countDocuments({ doctorId: doctor._id, status: 'no_show', slotStart: { $gte: month } }),
  ]);
  res.json({
    success: true,
    cards: {
      today,
      weekly,
      monthly,
      avgConsultationTime: doctor.avgConsultationMinutes,
      completionRate: monthly ? Math.round((completed / monthly) * 100) : 0,
      noShowRate: monthly ? Math.round((noShows / monthly) * 100) : 0,
    },
  });
});

const search = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const hospitalId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.hospitalId;
  const userFilter = { role: 'PATIENT', $or: [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] };
  const users = await User.find(userFilter).limit(8);
  const patients = await Patient.find({
    $or: [{ userId: { $in: users.map((u) => u._id) } }, { healthId: new RegExp(q, 'i') }],
    ...(hospitalId ? { hospitalIds: hospitalId } : {}),
  }).populate('userId', 'name phone email').limit(8);
  const appointments = await Appointment.find({
    $or: [{ code: new RegExp(q, 'i') }, { token: new RegExp(q, 'i') }],
    ...(hospitalId ? { hospitalId } : {}),
  }).limit(8);
  const invoices = await Invoice.find({
    number: new RegExp(q, 'i'),
    ...(hospitalId ? { hospitalId } : {}),
  }).limit(8);
  res.json({ success: true, patients, appointments, invoices });
});

module.exports = {
  listHospitals,
  getHospital,
  upsertHospital,
  approveHospital,
  listDoctors,
  listPatients,
  getPatient,
  createWalkIn,
  familyMembers,
  slots,
  createAppointment,
  listAppointments,
  updateAppointment,
  joinQueue,
  getQueue,
  displayQueue,
  advanceQueue,
  startConsultation,
  updateConsultation,
  aiDraft,
  approveConsultation,
  timeline,
  analyticsHospital,
  analyticsPlatform,
  analyticsDoctor,
  search,
  paged,
  LabTest,
  LabOrder,
  LabReport,
  Medicine,
  PharmacyOrder,
  Invoice,
  Payment,
  HealthCamp,
  CampRegistration,
  Ward,
  Room,
  Bed,
  Inventory,
  Notification,
  DocumentFile,
  Referral,
  Feedback,
  AuditLog,
  Announcement,
  SupportTicket,
  SubscriptionPlan,
  SecondOpinion,
  User,
  Staff,
  Department,
  Doctor,
  Patient,
};
