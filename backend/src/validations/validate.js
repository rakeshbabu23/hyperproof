const { ValidationError } = require('../errors/AppError');

/**
 * Reusable Zod validation middleware.
 *
 * @param {import('zod').ZodType} schema
 * @param {'body'|'params'|'query'} [source='body']
 *
 * Usage:
 *   router.post('/risks', validate(createRiskSchema), asyncHandler(controller.create));
 */
function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : source,
        message: issue.message,
      }));

      return next(new ValidationError(errors[0].message, errors));
    }

    req[source] = result.data;
    return next();
  };
}

module.exports = validate;
