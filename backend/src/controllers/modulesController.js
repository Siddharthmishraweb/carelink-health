const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { tenantQuery } = require('../utils/scope');
const { notify } = require('../services/notificationService');
const { generateInvoiceNumber } = require('../utils/healthId');
const {
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
} = require('./coreController');
const QRCode = require('qrcode');
const path = require('path');

const crud = (Model, opts = {}) => ({
  list: asyncHandler(async (req, res) => {
    const query = opts.global ? {} : tenantQuery(req);
    if (req.query.status) query.status = req.query.status;
    if (req.query.q && opts.search) query[opts.search] = new RegExp(req.query.q, 'i');
    const result = await paged(Model, query, req, opts.populate);
    res.json({ success: true, ...result });
  }),
  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    if (!opts.global && req.user.hospitalId) payload.hospitalId = req.user.hospitalId;
    const item = await Model.create(payload);
    res.status(201).json({ success: true, item });
  }),
  update: asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  }),
});

const labs = {
  catalog: crud(LabTest, { search: 'name' }),
  orders: crud(LabOrder, { populate: ['patientId', 'tests', 'doctorId'] }),
  collect: asyncHandler(async (req, res) => {
    const item = await LabOrder.findByIdAndUpdate(req.params.id, { status: 'sample_collected' }, { new: true });
    res.json({ success: true, item });
  }),
  enterResult: asyncHandler(async (req, res) => {
    const order = await LabOrder.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Lab order not found');
    const results = (req.body.results || []).map((row) => ({
      ...row,
      abnormal: row.low != null && row.high != null ? row.value < row.low || row.value > row.high : false,
    }));
    const report = await LabReport.create({
      hospitalId: order.hospitalId,
      orderId: order._id,
      patientId: order.patientId,
      results,
      notes: req.body.notes,
    });
    order.status = 'result_entered';
    await order.save();
    res.json({ success: true, report });
  }),
  approve: asyncHandler(async (req, res) => {
    const order = await LabOrder.findByIdAndUpdate(req.params.id, { status: 'released' }, { new: true });
    if (!order) throw new ApiError(404, 'Lab order not found');
    const report = await LabReport.findOneAndUpdate({ orderId: order._id }, { approvedBy: req.user._id }, { new: true });
    await notify({
      hospitalId: order.hospitalId,
      patientId: order.patientId,
      category: 'lab',
      title: 'Lab report ready',
      body: 'Your lab report is ready to view.',
    });
    res.json({ success: true, order, report });
  }),
  reports: asyncHandler(async (req, res) => {
    const query = req.user.role === 'PATIENT'
      ? { patientId: (await Patient.findOne({ userId: req.user._id }))?._id }
      : tenantQuery(req);
    if (req.query.patientId) query.patientId = req.query.patientId;
    const result = await paged(LabReport, query, req, ['orderId', 'patientId']);
    res.json({ success: true, ...result });
  }),
  compare: asyncHandler(async (req, res) => {
    const patientId = req.query.patientId;
    const reports = await LabReport.find({ patientId }).sort({ createdAt: 1 });
    const series = {};
    reports.forEach((report) => {
      report.results.forEach((row) => {
        if (!series[row.analyte]) series[row.analyte] = [];
        series[row.analyte].push({
          date: report.createdAt,
          value: row.value,
          unit: row.unit,
          low: row.low,
          high: row.high,
          abnormal: row.abnormal,
        });
      });
    });
    res.json({ success: true, series });
  }),
};

const pharmacy = {
  medicines: crud(Medicine, { search: 'name' }),
  orders: crud(PharmacyOrder, { populate: ['patientId', 'prescriptionId'] }),
  dispense: asyncHandler(async (req, res) => {
    const order = await PharmacyOrder.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Pharmacy order not found');
    order.status = 'dispensed';
    order.dispensedBy = req.user._id;
    order.total = (order.items || []).reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 1), 0);
    await order.save();
    if (order.total) {
      await Invoice.create({
        number: generateInvoiceNumber(),
        hospitalId: order.hospitalId,
        patientId: order.patientId,
        items: [{ type: 'pharmacy', description: 'Pharmacy dispense', amount: order.total }],
        subtotal: order.total,
        total: order.total,
        status: 'unpaid',
      });
    }
    res.json({ success: true, order });
  }),
};

const billing = {
  invoices: asyncHandler(async (req, res) => {
    const query = req.user.role === 'PATIENT'
      ? { patientId: (await Patient.findOne({ userId: req.user._id }))?._id }
      : tenantQuery(req);
    const result = await paged(Invoice, query, req, ['patientId']);
    res.json({ success: true, ...result });
  }),
  pay: asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    const amount = Number(req.body.amount || invoice.total - invoice.paid);
    const payment = await Payment.create({
      invoiceId: invoice._id,
      hospitalId: invoice.hospitalId,
      patientId: invoice.patientId,
      amount,
      method: req.body.method || 'upi',
      receiptNumber: `RCT-${Date.now().toString().slice(-6)}`,
    });
    invoice.paid += amount;
    invoice.status = invoice.paid >= invoice.total ? 'paid' : 'partial';
    if (req.body.refund) {
      invoice.status = 'refunded';
      payment.status = 'refunded';
      await payment.save();
    }
    await invoice.save();
    res.json({ success: true, invoice, payment });
  }),
};

const camps = {
  list: asyncHandler(async (req, res) => {
    const query = { status: { $in: ['upcoming', 'open'] } };
    if (req.query.hospitalId) query.hospitalId = req.query.hospitalId;
    const result = await paged(HealthCamp, query, req, ['hospitalId', 'doctors']);
    res.json({ success: true, ...result });
  }),
  create: crud(HealthCamp).create,
  register: asyncHandler(async (req, res) => {
    const camp = await HealthCamp.findById(req.params.id);
    if (!camp) throw new ApiError(404, 'Camp not found');
    if (camp.registered >= camp.slots) throw new ApiError(409, 'All slots are filled');
    const patient = req.body.patientId
      ? await Patient.findById(req.body.patientId)
      : await Patient.findOne({ userId: req.user._id });
    if (!patient) throw new ApiError(404, 'Patient not found');
    const existing = await CampRegistration.findOne({ campId: camp._id, patientId: patient._id });
    if (existing) return res.json({ success: true, registration: existing });
    const qrCode = await QRCode.toDataURL(JSON.stringify({ type: 'camp', campId: camp._id, patientId: patient._id }));
    const registration = await CampRegistration.create({
      campId: camp._id,
      patientId: patient._id,
      familyMemberId: req.body.familyMemberId,
      qrCode,
      status: 'confirmed',
    });
    camp.registered += 1;
    await camp.save();
    await notify({
      hospitalId: camp.hospitalId,
      userId: patient.userId,
      patientId: patient._id,
      category: 'healthCamp',
      title: 'Camp registration confirmed',
      body: `You are registered for ${camp.title}.`,
    });
    res.status(201).json({ success: true, registration });
  }),
  mine: asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ userId: req.user._id });
    const items = await CampRegistration.find({ patientId: patient._id }).populate('campId');
    res.json({ success: true, items });
  }),
};

const facility = {
  wards: crud(Ward),
  rooms: crud(Room),
  beds: crud(Bed, { populate: ['wardId', 'roomId', 'patientId'] }),
};

const inventory = crud(Inventory, { search: 'name' });

const notifications = {
  list: asyncHandler(async (req, res) => {
    const query = { userId: req.user._id };
    const result = await paged(Notification, query, req);
    res.json({ success: true, ...result });
  }),
  read: asyncHandler(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  }),
};

const documents = {
  list: asyncHandler(async (req, res) => {
    const patient = req.user.role === 'PATIENT'
      ? await Patient.findOne({ userId: req.user._id })
      : null;
    const query = patient ? { patientId: patient._id } : { patientId: req.query.patientId };
    const result = await paged(DocumentFile, query, req);
    res.json({ success: true, ...result });
  }),
  upload: asyncHandler(async (req, res) => {
    const patient = req.body.patientId
      ? await Patient.findById(req.body.patientId)
      : await Patient.findOne({ userId: req.user._id });
    const file = req.file;
    if (!file) throw new ApiError(400, 'File is required');
    if (!patient) throw new ApiError(404, 'Patient not found');
    const item = await DocumentFile.create({
      hospitalId: req.user.hospitalId,
      patientId: patient._id,
      uploadedBy: req.user._id,
      category: req.body.category || 'other',
      title: req.body.title || file.originalname,
      fileName: file.originalname,
      filePath: path.posix.join('uploads', file.filename),
      mimeType: file.mimetype,
    });
    res.status(201).json({ success: true, item });
  }),
};

const referrals = {
  create: asyncHandler(async (req, res) => {
    const item = await Referral.create({ ...req.body, hospitalId: req.user.hospitalId, fromDoctorId: req.body.fromDoctorId });
    res.status(201).json({ success: true, item });
  }),
  list: asyncHandler(async (req, res) => {
    const result = await paged(Referral, tenantQuery(req), req, ['patientId', 'fromDoctorId', 'toDoctorId', 'toDepartmentId']);
    res.json({ success: true, ...result });
  }),
};

const feedback = {
  create: asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ userId: req.user._id });
    const item = await Feedback.create({ ...req.body, patientId: patient?._id, hospitalId: req.body.hospitalId });
    res.status(201).json({ success: true, item });
  }),
  list: asyncHandler(async (req, res) => {
    const result = await paged(Feedback, tenantQuery(req), req, ['patientId', 'doctorId']);
    res.json({ success: true, ...result });
  }),
};

const announcements = crud(Announcement);
const tickets = crud(SupportTicket, { global: true });
const plans = crud(SubscriptionPlan, { global: true });

const secondOpinion = {
  create: asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) throw new ApiError(404, 'Patient profile not found');
    const item = await SecondOpinion.create({
      ...req.body,
      patientId: patient._id,
      hospitalId: req.body.hospitalId || patient.primaryHospitalId || patient.hospitalIds?.[0],
    });
    res.status(201).json({ success: true, item });
  }),
  list: asyncHandler(async (req, res) => {
    const query = req.user.role === 'PATIENT'
      ? { patientId: (await Patient.findOne({ userId: req.user._id }))?._id }
      : tenantQuery(req);
    const result = await paged(SecondOpinion, query, req, ['patientId', 'requestedDoctorId']);
    res.json({ success: true, ...result });
  }),
};

const staff = {
  list: asyncHandler(async (req, res) => {
    const result = await paged(Staff, tenantQuery(req), req, ['userId', 'departmentId']);
    res.json({ success: true, ...result });
  }),
  create: asyncHandler(async (req, res) => {
    const passwordHash = await User.hashPassword(req.body.password || 'Staff@12345');
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      passwordHash,
      role: req.body.staffType,
      hospitalId: req.user.hospitalId,
    });
    const item = await Staff.create({
      userId: user._id,
      hospitalId: req.user.hospitalId,
      departmentId: req.body.departmentId,
      staffType: req.body.staffType,
      employeeCode: req.body.employeeCode,
      shift: req.body.shift,
    });
    if (req.body.staffType === 'DOCTOR' || req.body.specialization) {
      await Doctor.create({
        userId: user._id,
        hospitalId: req.user.hospitalId,
        departmentId: req.body.departmentId,
        specialization: req.body.specialization || 'General Medicine',
        consultationFee: req.body.consultationFee || 500,
        roomNumber: req.body.roomNumber,
      });
    }
    res.status(201).json({ success: true, user, item });
  }),
};

const departments = crud(Department);
const vitals = asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const Consultation = require('../models/Consultation');
  const appointment = await Appointment.findById(req.params.appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  const consultation = await Consultation.findOneAndUpdate(
    { appointmentId: appointment._id },
    {
      $set: { vitals: req.body.vitals, nursingNotes: req.body.nursingNotes },
      $setOnInsert: {
        appointmentId: appointment._id,
        hospitalId: appointment.hospitalId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        departmentId: appointment.departmentId,
        status: 'draft',
      },
    },
    { new: true, upsert: true }
  );
  res.json({ success: true, consultation });
});

const emergencyCard = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ healthId: req.params.healthId }).populate('userId', 'name');
  if (!patient) throw new ApiError(404, 'Health ID not found');
  const share = patient.emergencyShare || {};
  const medical = patient.medical || {};
  const card = {
    name: patient.userId?.name,
    healthId: patient.healthId,
    bloodGroup: share.shareBloodGroup !== false ? patient.bloodGroup : undefined,
    allergies: share.shareAllergies !== false ? medical.allergies || [] : [],
    medications: share.shareMedications !== false ? medical.currentMedications || [] : [],
    emergencyContact: patient.emergencyContact,
    alerts: medical.alerts || [],
  };
  res.json({ success: true, card });
});

const healthIdCard = asyncHandler(async (req, res) => {
  const patient = req.user.role === 'PATIENT'
    ? await Patient.findOne({ userId: req.user._id }).populate('userId', 'name')
    : await Patient.findById(req.params.patientId).populate('userId', 'name');
  if (!patient) throw new ApiError(404, 'Patient not found');
  const qr = await QRCode.toDataURL(JSON.stringify({ type: 'health-id', healthId: patient.healthId }));
  res.json({
    success: true,
    card: {
      name: patient.userId.name,
      healthId: patient.healthId,
      qr,
    },
  });
});

const auditLogs = asyncHandler(async (req, res) => {
  const result = await paged(AuditLog, tenantQuery(req), req);
  res.json({ success: true, ...result });
});

const users = asyncHandler(async (req, res) => {
  const query = req.user.role === 'SUPER_ADMIN' ? {} : { hospitalId: req.user.hospitalId };
  if (req.query.role) query.role = req.query.role;
  const result = await paged(User, query, req);
  res.json({ success: true, ...result });
});

const prescriptions = asyncHandler(async (req, res) => {
  const query = req.user.role === 'PATIENT'
    ? { patientId: (await Patient.findOne({ userId: req.user._id }))?._id }
    : tenantQuery(req);
  const result = await paged(require('../models/Prescription'), query, req, ['patientId', 'doctorId']);
  res.json({ success: true, ...result });
});

const updatePrefs = asyncHandler(async (req, res) => {
  req.user.notificationPrefs = { ...req.user.notificationPrefs.toObject?.() || req.user.notificationPrefs, ...req.body };
  await req.user.save();
  res.json({ success: true, notificationPrefs: req.user.notificationPrefs });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = req.user.role === 'PATIENT'
    ? await Patient.findOneAndUpdate({ userId: req.user._id }, req.body, { new: true })
    : await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, patient });
});

module.exports = {
  labs,
  pharmacy,
  billing,
  camps,
  facility,
  inventory,
  notifications,
  documents,
  referrals,
  feedback,
  announcements,
  tickets,
  plans,
  secondOpinion,
  staff,
  departments,
  vitals,
  emergencyCard,
  healthIdCard,
  auditLogs,
  users,
  prescriptions,
  updatePrefs,
  updatePatient,
};
