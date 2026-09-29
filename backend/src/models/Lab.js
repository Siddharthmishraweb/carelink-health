const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    code: String,
    category: String,
    price: Number,
    sampleType: String,
    turnaroundHours: Number,
    referenceRanges: [
      {
        analyte: String,
        unit: String,
        low: Number,
        high: Number,
      },
    ],
  },
  { timestamps: true }
);

labTestSchema.index({ hospitalId: 1, name: 1 });

const labOrderSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' }],
    status: {
      type: String,
      enum: ['ordered', 'sample_collected', 'processing', 'result_entered', 'approved', 'released'],
      default: 'ordered',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sampleCode: String,
    notes: String,
  },
  { timestamps: true }
);

labOrderSchema.index({ hospitalId: 1, status: 1 });
labOrderSchema.index({ patientId: 1, createdAt: -1 });

const labReportSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabOrder', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    results: [
      {
        analyte: String,
        value: Number,
        unit: String,
        low: Number,
        high: Number,
        abnormal: Boolean,
      },
    ],
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pdfPath: String,
    notes: String,
  },
  { timestamps: true }
);

labReportSchema.index({ patientId: 1, createdAt: -1 });
labReportSchema.index({ orderId: 1 });

module.exports = {
  LabTest: mongoose.model('LabTest', labTestSchema),
  LabOrder: mongoose.model('LabOrder', labOrderSchema),
  LabReport: mongoose.model('LabReport', labReportSchema),
};
