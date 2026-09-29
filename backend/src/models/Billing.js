const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    items: [
      {
        type: { type: String, enum: ['consultation', 'lab', 'pharmacy', 'procedure', 'room', 'other'] },
        description: String,
        amount: Number,
      },
    ],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: Number,
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ['unpaid', 'partial', 'paid', 'refunded'], default: 'unpaid' },
  },
  { timestamps: true }
);

invoiceSchema.index({ hospitalId: 1, createdAt: -1 });
invoiceSchema.index({ patientId: 1 });
invoiceSchema.index({ number: 1 }, { unique: true });

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: Number,
    method: { type: String, enum: ['cash', 'upi', 'card', 'insurance', 'online'], default: 'upi' },
    status: { type: String, enum: ['success', 'pending', 'failed', 'refunded'], default: 'success' },
    receiptNumber: String,
    reference: String,
  },
  { timestamps: true }
);

paymentSchema.index({ hospitalId: 1, createdAt: -1 });
paymentSchema.index({ invoiceId: 1 });

module.exports = {
  Invoice: mongoose.model('Invoice', invoiceSchema),
  Payment: mongoose.model('Payment', paymentSchema),
};
