const { z } = require('zod');
const { RISK_CATEGORIES, RISK_STATUSES } = require('../constants/enums');

const categoryValues = [...RISK_CATEGORIES];
const statusValues = [...RISK_STATUSES];

const riskBodySchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .trim()
    .min(1, { error: 'Title is required' }),
  description: z
    .string({ error: 'Description is required' })
    .trim()
    .min(1, { error: 'Description is required' }),
  category: z.enum(categoryValues, {
    error: `Category must be one of: ${categoryValues.join(', ')}`,
  }),
  owner: z
    .string({ error: 'Owner is required' })
    .trim()
    .min(1, { error: 'Owner is required' }),
  likelihood: z
    .number({ error: 'Likelihood must be an integer between 1 and 5' })
    .int({ error: 'Likelihood must be an integer between 1 and 5' })
    .min(1, { error: 'Likelihood must be an integer between 1 and 5' })
    .max(5, { error: 'Likelihood must be an integer between 1 and 5' }),
  impact: z
    .number({ error: 'Impact must be an integer between 1 and 5' })
    .int({ error: 'Impact must be an integer between 1 and 5' })
    .min(1, { error: 'Impact must be an integer between 1 and 5' })
    .max(5, { error: 'Impact must be an integer between 1 and 5' }),
  status: z.enum(statusValues, {
    error: `Status must be one of: ${statusValues.join(', ')}`,
  }),
});

const createRiskSchema = riskBodySchema;
const updateRiskSchema = riskBodySchema;

const listRisksQuerySchema = z.object({
  category: z
    .enum(categoryValues, {
      error: `Category must be one of: ${categoryValues.join(', ')}`,
    })
    .optional(),
  status: z
    .enum(statusValues, {
      error: `Status must be one of: ${statusValues.join(', ')}`,
    })
    .optional(),
});

module.exports = {
  riskBodySchema,
  createRiskSchema,
  updateRiskSchema,
  listRisksQuerySchema,
};
