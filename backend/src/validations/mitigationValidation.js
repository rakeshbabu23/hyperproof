const { z } = require('zod');

const mitigationBodySchema = z.object({
  description: z
    .string({ error: 'Description is required' })
    .trim()
    .min(1, { error: 'Description is required' }),
  effectiveness: z
    .number({ error: 'Effectiveness must be an integer between 1 and 5' })
    .int({ error: 'Effectiveness must be an integer between 1 and 5' })
    .min(1, { error: 'Effectiveness must be an integer between 1 and 5' })
    .max(5, { error: 'Effectiveness must be an integer between 1 and 5' }),
});

const createMitigationSchema = mitigationBodySchema;
const updateMitigationSchema = mitigationBodySchema;

module.exports = {
  mitigationBodySchema,
  createMitigationSchema,
  updateMitigationSchema,
};
