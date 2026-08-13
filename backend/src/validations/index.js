const validate = require('./validate');
const {
  riskBodySchema,
  createRiskSchema,
  updateRiskSchema,
  listRisksQuerySchema,
} = require('./riskValidation');
const {
  mitigationBodySchema,
  createMitigationSchema,
  updateMitigationSchema,
} = require('./mitigationValidation');

module.exports = {
  validate,
  riskBodySchema,
  createRiskSchema,
  updateRiskSchema,
  listRisksQuerySchema,
  mitigationBodySchema,
  createMitigationSchema,
  updateMitigationSchema,
};
