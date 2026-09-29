const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    medicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    tests: [String],
    instructions: String,
    followUp: String,
    status: { type: String, enum: ['draft', 'issued', 'dispensed', 'partial'], default: 'issued' },
    pdfPath: String,
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ hospitalId: 1 });
prescriptionSchema.index({ consultationId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
