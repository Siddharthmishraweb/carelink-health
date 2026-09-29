const { AuditLog } = require('../models/Supporting');

function audit(action, resource) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 400) return;
      try {
        await AuditLog.create({
          hospitalId: req.user?.hospitalId || req.body.hospitalId,
          actorId: req.user?._id,
          actorName: req.user?.name,
          actorRole: req.user?.role,
          action,
          resource,
          resourceId: req.params.id || req.body.patientId || req.body._id,
          reason: req.body.accessReason || req.query.reason || action,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            path: req.originalUrl,
          },
        });
      } catch (_error) {
        // Audit failures must not break the request
      }
    });
    next();
  };
}

module.exports = audit;
