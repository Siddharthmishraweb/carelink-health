const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    specialization: { type: String, required: true },
    registrationNumber: String,
    qualification: String,
    experienceYears: Number,
    consultationFee: { type: Number, default: 500 },
    roomNumber: String,
    slotDuration: { type: Number, default: 15 },
    bufferTime: { type: Number, default: 5 },
    availability: [
      {
        day: Number,
        start: String,
        end: String,
      },
    ],
    leaves: [{ date: Date, reason: String }],
    avgConsultationMinutes: { type: Number, default: 12 },
    status: { type: String, enum: ['available', 'busy', 'offline', 'on_leave'], default: 'available' },
    teleconsultEnabled: { type: Boolean, default: true },
    bio: String,
  },
  { timestamps: true }
);

doctorSchema.index({ hospitalId: 1, departmentId: 1 });
doctorSchema.index({ userId: 1 }, { unique: true });
doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
