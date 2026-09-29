const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: String,
    building: String,
    floor: String,
    type: String,
  },
  { timestamps: true }
);

const roomSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
    number: String,
    type: String,
  },
  { timestamps: true }
);

const bedSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    number: String,
    status: { type: String, enum: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'], default: 'available' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  },
  { timestamps: true }
);

wardSchema.index({ hospitalId: 1 });
roomSchema.index({ hospitalId: 1, number: 1 });
bedSchema.index({ hospitalId: 1, status: 1 });

module.exports = {
  Ward: mongoose.model('Ward', wardSchema),
  Room: mongoose.model('Room', roomSchema),
  Bed: mongoose.model('Bed', bedSchema),
};
