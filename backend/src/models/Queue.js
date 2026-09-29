const mongoose = require('mongoose');

const queueItemSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    token: String,
    priority: String,
    status: {
      type: String,
      enum: ['waiting', 'called', 'serving', 'completed', 'skipped', 'no_show'],
      default: 'waiting',
    },
    arrivedAt: Date,
    calledAt: Date,
    startedAt: Date,
    completedAt: Date,
    estimatedWaitMinutes: Number,
  },
  { _id: true }
);

const queueSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    date: { type: String, required: true },
    currentToken: String,
    nextToken: String,
    servingItemId: mongoose.Schema.Types.ObjectId,
    roomNumber: String,
    doctorStatus: { type: String, default: 'available' },
    items: [queueItemSchema],
    avgMinutes: { type: Number, default: 12 },
  },
  { timestamps: true }
);

queueSchema.index({ hospitalId: 1, doctorId: 1, date: 1 }, { unique: true });
queueSchema.index({ 'items.status': 1 });

module.exports = mongoose.model('Queue', queueSchema);
