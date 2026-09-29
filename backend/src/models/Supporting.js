const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    category: String,
    title: String,
    body: String,
    channel: { type: String, enum: ['in-app', 'email', 'sms', 'push', 'whatsapp'], default: 'in-app' },
    read: { type: Boolean, default: false },
    metadata: Object,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ patientId: 1, createdAt: -1 });

const documentSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: String,
    title: String,
    fileName: String,
    filePath: String,
    mimeType: String,
    shareToken: String,
    shareExpiresAt: Date,
  },
  { timestamps: true }
);

documentSchema.index({ patientId: 1, createdAt: -1 });
documentSchema.index({ shareToken: 1 });

const referralSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    fromDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    toDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    toDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    reason: String,
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    status: { type: String, enum: ['sent', 'accepted', 'completed'], default: 'sent' },
  },
  { timestamps: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    appointmentExperience: Number,
    waitingExperience: Number,
    hospitalService: Number,
    doctorCommunication: Number,
    staffExperience: Number,
    comment: String,
    privateToAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const auditLogSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    actorRole: String,
    action: String,
    resource: String,
    resourceId: mongoose.Schema.Types.Mixed,
    reason: String,
    ip: String,
    userAgent: String,
    metadata: Object,
  },
  { timestamps: true }
);

auditLogSchema.index({ hospitalId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

const announcementSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    title: String,
    body: String,
    audience: { type: String, enum: ['all', 'department', 'doctor', 'camp', 'group', 'platform'], default: 'all' },
    targetId: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: String,
    message: String,
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

const planSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    name: String,
    monthlyPrice: Number,
    features: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const secondOpinionSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    requestedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    records: [String],
    note: String,
    status: { type: String, enum: ['requested', 'in_review', 'completed'], default: 'requested' },
    reviewNote: String,
  },
  { timestamps: true }
);

module.exports = {
  Notification: mongoose.model('Notification', notificationSchema),
  DocumentFile: mongoose.model('DocumentFile', documentSchema),
  Referral: mongoose.model('Referral', referralSchema),
  Feedback: mongoose.model('Feedback', feedbackSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  Announcement: mongoose.model('Announcement', announcementSchema),
  SupportTicket: mongoose.model('SupportTicket', supportTicketSchema),
  SubscriptionPlan: mongoose.model('SubscriptionPlan', planSchema),
  SecondOpinion: mongoose.model('SecondOpinion', secondOpinionSchema),
};
