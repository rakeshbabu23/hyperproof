const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const mitigationController = require('../controllers/mitigationController');
const {
  validate,
  updateMitigationSchema,
} = require('../validations');

const router = express.Router();

router.put('/:id', validate(updateMitigationSchema), asyncHandler(mitigationController.update));
router.delete('/:id', asyncHandler(mitigationController.remove));

module.exports = router;
