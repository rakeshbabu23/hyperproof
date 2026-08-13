const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const riskController = require('../controllers/riskController');
const mitigationController = require('../controllers/mitigationController');
const {
  validate,
  createRiskSchema,
  updateRiskSchema,
  listRisksQuerySchema,
  createMitigationSchema,
} = require('../validations');

const router = express.Router();

router.post('/', validate(createRiskSchema), asyncHandler(riskController.create));
router.get('/', validate(listRisksQuerySchema, 'query'), asyncHandler(riskController.list));
router.get('/:id', asyncHandler(riskController.getById));
router.put('/:id', validate(updateRiskSchema), asyncHandler(riskController.update));
router.delete('/:id', asyncHandler(riskController.remove));

router.post(
  '/:riskId/mitigations',
  validate(createMitigationSchema),
  asyncHandler(mitigationController.create),
);

module.exports = router;
