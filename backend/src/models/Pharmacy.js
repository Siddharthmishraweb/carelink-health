const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    genericName: String,
    category: String,
    batchNumber: String,
    expiryDate: Date,
    quantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 20 },
    unitPrice: Number,
    supplier: String,
  },
  { timestamps: true }
);

medicineSchema.index({ hospitalId: 1, name: 1 });
medicineSchema.index({ expiryDate: 1 });

const pharmacyOrderSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    items: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    status: { type: String, enum: ['queued', 'partial', 'dispensed', 'cancelled'], default: 'queued' },
    total: Number,
    dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

pharmacyOrderSchema.index({ hospitalId: 1, status: 1 });
pharmacyOrderSchema.index({ patientId: 1 });

module.exports = {
  Medicine: mongoose.model('Medicine', medicineSchema),
  PharmacyOrder: mongoose.model('PharmacyOrder', pharmacyOrderSchema),
};
