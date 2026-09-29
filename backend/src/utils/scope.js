const ApiError = require('./ApiError');

function tenantQuery(req, extra = {}) {
  if (req.user.role === 'SUPER_ADMIN') return extra;
  if (!req.user.hospitalId) throw new ApiError(403, 'Hospital context required');
  return { hospitalId: req.user.hospitalId, ...extra };
}

function patientSelf(req, extra = {}) {
  if (req.user.role === 'PATIENT') {
    return extra;
  }
  return extra;
}

module.exports = { tenantQuery, patientSelf };
