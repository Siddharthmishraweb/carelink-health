const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    status: { type: String, enum: ['draft', 'in_progress', 'pending_review', 'approved', 'completed'], default: 'draft' },
    consentCaptured: { type: Boolean, default: false },
    complaints: [String],
    history: {
      duration: String,
      onset: String,
      previousHistory: String,
      existingMedications: [String],
      allergies: [String],
    },
    examination: String,
    assessment: String,
    diagnosis: [String],
    clinicalNotes: String,
    vitals: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      spo2: Number,
      weight: Number,
      height: Number,
      bloodSugar: Number,
    },
    nursingNotes: String,
    followUpDate: Date,
    followUpNote: String,
    certificateNote: String,
    aiDraft: {
      complaints: [String],
      history: Object,
      examination: String,
      assessment: String,
      prescription: [Object],
      followUp: String,
      disclaimer: { type: String, default: 'AI-generated draft — Doctor review required.' },
      generatedAt: Date,
      reviewed: { type: Boolean, default: false },
    },
    approvedAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

consultationSchema.index({ patientId: 1, createdAt: -1 });
consultationSchema.index({ doctorId: 1, createdAt: -1 });
consultationSchema.index({ appointmentId: 1 }, { unique: true });
consultationSchema.index({ hospitalId: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
