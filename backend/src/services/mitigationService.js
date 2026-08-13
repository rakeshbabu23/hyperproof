const riskRepository = require('../repositories/riskRepository');
const mitigationRepository = require('../repositories/mitigationRepository');
const { toRiskResponse } = require('./riskService');
const { NotFoundError, ValidationError } = require('../errors/AppError');

function assertMitigationData(data) {
  const description =
    typeof data.description === 'string' ? data.description.trim() : '';
  if (!description) {
    throw new ValidationError('Description is required', [
      { field: 'description', message: 'Description is required' },
    ]);
  }

  if (
    !Number.isInteger(data.effectiveness) ||
    data.effectiveness < 1 ||
    data.effectiveness > 5
  ) {
    throw new ValidationError(
      'Effectiveness must be an integer between 1 and 5',
      [
        {
          field: 'effectiveness',
          message: 'Effectiveness must be an integer between 1 and 5',
        },
      ],
    );
  }
}

function toMitigationResponse(mitigation) {
  return {
    id: mitigation.id,
    riskId: mitigation.riskId,
    description: mitigation.description,
    effectiveness: mitigation.effectiveness,
    createdAt: mitigation.createdAt,
  };
}

function getRiskOrThrow(riskId) {
  const risk = riskRepository.findById(riskId);
  if (!risk) {
    throw new NotFoundError(`Risk with id ${riskId} was not found`);
  }
  return risk;
}

function getMitigationOrThrow(id) {
  const mitigation = mitigationRepository.findById(id);
  if (!mitigation) {
    throw new NotFoundError(`Mitigation with id ${id} was not found`);
  }
  return mitigation;
}

function createMitigation(riskId, data) {
  assertMitigationData(data);
  const risk = getRiskOrThrow(riskId);

  const mitigation = mitigationRepository.create({
    riskId: Number(riskId),
    description: data.description.trim(),
    effectiveness: data.effectiveness,
  });

  const mitigations = mitigationRepository.findByRiskId(riskId);
  // Residual is recalculated from the current mitigations (not stored).
  return {
    mitigation: toMitigationResponse(mitigation),
    risk: toRiskResponse(risk, mitigations),
  };
}

function updateMitigation(id, data) {
  assertMitigationData(data);
  const existing = getMitigationOrThrow(id);

  const mitigation = mitigationRepository.update(id, {
    description: data.description.trim(),
    effectiveness: data.effectiveness,
  });

  const risk = getRiskOrThrow(existing.riskId);
  const mitigations = mitigationRepository.findByRiskId(existing.riskId);

  return {
    mitigation: toMitigationResponse(mitigation),
    risk: toRiskResponse(risk, mitigations),
  };
}

function deleteMitigation(id) {
  const existing = getMitigationOrThrow(id);
  const riskId = existing.riskId;
  const risk = getRiskOrThrow(riskId);
  const currentMitigations = mitigationRepository.findByRiskId(riskId);

  // Keep the Closed-without-mitigation rule enforceable: do not allow
  // removing the last mitigation from an already-Closed risk.
  if (risk.status === 'Closed' && currentMitigations.length === 1) {
    throw new ValidationError(
      'Cannot delete the last mitigation from a Closed risk',
    );
  }

  mitigationRepository.remove(id);
  const mitigations = mitigationRepository.findByRiskId(riskId);

  return {
    id: Number(id),
    deleted: true,
    risk: toRiskResponse(risk, mitigations),
  };
}

module.exports = {
  createMitigation,
  updateMitigation,
  deleteMitigation,
  toMitigationResponse,
};
