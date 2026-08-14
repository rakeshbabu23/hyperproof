const { AppError, ValidationError } = require('../errors/AppError');

/**
 * Centralized Express error handler.
 * AppError subclasses keep their status/message; unexpected errors
 * (including SQLite/driver failures) are never leaked to the client.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    const payload = {
      success: false,
      message: err.message,
    };

    if (err instanceof ValidationError && err.errors?.length) {
      payload.errors = err.errors;
    }

    return res.status(err.statusCode).json(payload);
  }

  // Express body-parser / JSON parse failures are client errors.
  if (err.type === 'entity.parse.failed' || err.status === 400 || err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request body',
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}

module.exports = errorHandler;
