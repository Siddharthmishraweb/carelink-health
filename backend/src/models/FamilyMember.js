const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    ownerPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    linkedPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    gender: String,
    dateOfBirth: Date,
    healthId: String,
    phone: String,
    notes: String,
  },
  { timestamps: true }
);

familyMemberSchema.index({ ownerPatientId: 1 });
familyMemberSchema.index({ healthId: 1 });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
