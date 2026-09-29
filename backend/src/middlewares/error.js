const env = require('../config/env');

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal server error',
  };
  if (err.details) payload.details = err.details;
  if (env.nodeEnv !== 'production' && err.stack) payload.stack = err.stack;
  res.status(status).json(payload);
}

module.exports = errorHandler;
