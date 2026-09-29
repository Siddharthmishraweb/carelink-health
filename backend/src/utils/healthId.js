const { randomBytes } = require('crypto');

function generateHealthId() {
  return `HEALTH-${randomBytes(3).toString('hex').toUpperCase()}`;
}

function generateTokenNumber(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(2, '0')}`;
}

function generateInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-8)}`;
}

function generateAppointmentCode() {
  return `APT-${randomBytes(3).toString('hex').toUpperCase()}`;
}

module.exports = {
  generateHealthId,
  generateTokenNumber,
  generateInvoiceNumber,
  generateAppointmentCode,
};
