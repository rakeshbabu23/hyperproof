/**
 * Wraps an async Express route handler so rejected promises
 * and thrown errors are forwarded to the error middleware.
 *
 * Usage:
 *   router.get('/risks', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
