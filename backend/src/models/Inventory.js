const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['medicine', 'equipment', 'consumable', 'surgical', 'ppe', 'lab'], required: true },
    sku: String,
    quantity: Number,
    reorderLevel: Number,
    expiryDate: Date,
    unit: String,
    supplier: String,
    unitCost: Number,
  },
  { timestamps: true }
);

inventorySchema.index({ hospitalId: 1, category: 1 });
inventorySchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
