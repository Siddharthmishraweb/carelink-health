const ApiError = require('../utils/ApiError');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission for this action'));
    }
    next();
  };
}

function hospitalScoped(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (req.user.role === 'SUPER_ADMIN') return next();
  const requested = req.params.hospitalId || req.body.hospitalId || req.query.hospitalId;
  if (requested && String(req.user.hospitalId) !== String(requested)) {
    return next(new ApiError(403, 'Cross-hospital access is not allowed'));
  }
  req.hospitalId = req.user.hospitalId;
  next();
}

module.exports = { authorize, hospitalScoped };
