const mongoose = require('mongoose');

const healthCampSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    title: { type: String, required: true },
    description: String,
    category: String,
    date: Date,
    startTime: String,
    endTime: String,
    location: String,
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
    slots: { type: Number, default: 100 },
    registered: { type: Number, default: 0 },
    eligibility: String,
    services: [String],
    registrationDeadline: Date,
    status: { type: String, enum: ['upcoming', 'open', 'closed', 'completed'], default: 'open' },
  },
  { timestamps: true }
);

healthCampSchema.index({ hospitalId: 1, date: 1 });
healthCampSchema.index({ date: 1, status: 1 });

const campRegistrationSchema = new mongoose.Schema(
  {
    campId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthCamp', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    familyMemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
    qrCode: String,
    attended: { type: Boolean, default: false },
    status: { type: String, enum: ['registered', 'confirmed', 'attended', 'cancelled'], default: 'registered' },
  },
  { timestamps: true }
);

campRegistrationSchema.index({ campId: 1, patientId: 1 }, { unique: true });

module.exports = {
  HealthCamp: mongoose.model('HealthCamp', healthCampSchema),
  CampRegistration: mongoose.model('CampRegistration', campRegistrationSchema),
};
