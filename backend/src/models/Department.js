const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: String,
    tokenPrefix: { type: String, default: 'A' },
    roomHint: String,
  },
  { timestamps: true }
);

departmentSchema.index({ hospitalId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
