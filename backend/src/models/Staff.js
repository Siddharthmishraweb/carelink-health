const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    staffType: {
      type: String,
      enum: ['RECEPTIONIST', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'ADMIN'],
      required: true,
    },
    employeeCode: String,
    shift: { type: String, enum: ['morning', 'evening', 'night', 'rotating'], default: 'morning' },
    attendance: [{ date: Date, status: String, checkIn: String, checkOut: String }],
    leaves: [{ date: Date, reason: String, status: String }],
    assignedBeds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bed' }],
  },
  { timestamps: true }
);

staffSchema.index({ hospitalId: 1, staffType: 1 });
staffSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Staff', staffSchema);
