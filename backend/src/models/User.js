const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: [
        'SUPER_ADMIN',
        'HOSPITAL_ADMIN',
        'DOCTOR',
        'PATIENT',
        'RECEPTIONIST',
        'NURSE',
        'PHARMACIST',
        'LAB_TECHNICIAN',
      ],
      required: true,
    },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
    locale: { type: String, enum: ['en', 'hi'], default: 'en' },
    avatar: String,
    mfaEnabled: { type: Boolean, default: false },
    lastLoginAt: Date,
    notificationPrefs: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      categories: {
        appointment: { type: Boolean, default: true },
        queue: { type: Boolean, default: true },
        prescription: { type: Boolean, default: true },
        lab: { type: Boolean, default: true },
        billing: { type: Boolean, default: true },
        healthCamp: { type: Boolean, default: true },
        followUp: { type: Boolean, default: true },
        vaccination: { type: Boolean, default: true },
        announcement: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ hospitalId: 1, role: 1 });

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', userSchema);
