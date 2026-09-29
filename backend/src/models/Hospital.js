const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    legalName: String,
    email: String,
    phone: String,
    emergencyPhone: String,
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },
    branding: {
      logo: String,
      primaryColor: { type: String, default: '#0B1F3A' },
      accentColor: { type: String, default: '#0D9488' },
      displayName: String,
    },
    subscription: {
      planCode: { type: String, enum: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'], default: 'PROFESSIONAL' },
      status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' },
      seats: { type: Number, default: 25 },
    },
    settings: {
      languages: { type: [String], default: ['en', 'hi'] },
      teleconsultEnabled: { type: Boolean, default: true },
      secondOpinionEnabled: { type: Boolean, default: true },
      slotDuration: { type: Number, default: 15 },
      bufferTime: { type: Number, default: 5 },
      queuePolicies: {
        emergency: { type: Number, default: 100 },
        seniorCitizen: { type: Number, default: 40 },
        pregnant: { type: Number, default: 50 },
        child: { type: Number, default: 35 },
        disabled: { type: Number, default: 45 },
        scheduled: { type: Number, default: 20 },
      },
    },
    announcement: String,
    onboardingNotes: String,
    approvedAt: Date,
  },
  { timestamps: true }
);

hospitalSchema.index({ slug: 1 }, { unique: true });
hospitalSchema.index({ 'subscription.status': 1 });
hospitalSchema.index({ name: 'text', 'address.city': 'text' });

module.exports = mongoose.model('Hospital', hospitalSchema);
