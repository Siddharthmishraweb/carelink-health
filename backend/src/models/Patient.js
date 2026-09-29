const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    healthId: { type: String, required: true, unique: true },
    hospitalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }],
    primaryHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,
    bloodGroup: String,
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    medical: {
      allergies: [String],
      conditions: [String],
      surgeries: [String],
      currentMedications: [String],
      familyHistory: [String],
      immunizations: [{ name: String, dueDate: Date, givenDate: Date, status: String }],
      alerts: [String],
    },
    emergencyShare: {
      enabled: { type: Boolean, default: true },
      shareBloodGroup: { type: Boolean, default: true },
      shareAllergies: { type: Boolean, default: true },
      shareMedications: { type: Boolean, default: true },
    },
    insurance: {
      provider: String,
      policyNumber: String,
      validTill: Date,
      status: String,
    },
  },
  { timestamps: true }
);

patientSchema.index({ healthId: 1 }, { unique: true });
patientSchema.index({ userId: 1 }, { unique: true });
patientSchema.index({ hospitalIds: 1 });
patientSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Patient', patientSchema);
