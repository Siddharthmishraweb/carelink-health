const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    type: {
      type: String,
      enum: ['OPD', 'FOLLOW_UP', 'SPECIALIST', 'LAB', 'HEALTH_CAMP', 'TELECONSULT'],
      default: 'OPD',
    },
    slotStart: { type: Date, required: true },
    slotEnd: Date,
    status: {
      type: String,
      enum: ['booked', 'confirmed', 'arrived', 'in_queue', 'in_consult', 'completed', 'cancelled', 'no_show'],
      default: 'booked',
    },
    priority: {
      type: String,
      enum: ['normal', 'scheduled', 'child', 'senior', 'pregnant', 'disabled', 'emergency'],
      default: 'scheduled',
    },
    token: String,
    roomNumber: String,
    notes: String,
    source: { type: String, enum: ['patient', 'reception', 'doctor', 'system'], default: 'patient' },
    passQr: String,
    followUpOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    meetingLink: String,
  },
  { timestamps: true }
);

appointmentSchema.index({ hospitalId: 1, slotStart: 1 });
appointmentSchema.index({ doctorId: 1, slotStart: 1 });
appointmentSchema.index({ patientId: 1, slotStart: -1 });
appointmentSchema.index({ code: 1 }, { unique: true });
appointmentSchema.index({ status: 1, slotStart: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
