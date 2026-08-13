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

  console.error(err);

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}

module.exports = errorHandler;
