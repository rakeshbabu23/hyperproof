const riskRepository = require('../repositories/riskRepository');
const mitigationRepository = require('../repositories/mitigationRepository');
const {
  calculateInherentRisk,
  calculateResidualRisk,
  getSeverityBand,
} = require('../utils/riskCalculations');
const { NotFoundError, ValidationError } = require('../errors/AppError');

function assertCanClose(status, mitigationCount) {
  if (status === 'Closed' && mitigationCount === 0) {
    throw new ValidationError(
      'A risk cannot be marked as Closed when it has no mitigations',
    );
  }
}

function toRiskResponse(risk, mitigations = []) {
  const inherentScore = calculateInherentRisk(risk.likelihood, risk.impact);
  const residualScore = calculateResidualRisk(inherentScore, mitigations);

  return {
    id: risk.id,
    title: risk.title,
    description: risk.description,
    category: risk.category,
    owner: risk.owner,
    likelihood: risk.likelihood,
    impact: risk.impact,
    status: risk.status,
    createdAt: risk.createdAt,
    updatedAt: risk.updatedAt,
    inherentScore,
    inherentSeverity: getSeverityBand(inherentScore),
    residualScore,
    residualSeverity: getSeverityBand(residualScore),
    mitigationCount: mitigations.length,
  };
}

function createRisk(data) {
  assertCanClose(data.status, 0);

  const risk = riskRepository.create(data);
  return toRiskResponse(risk, []);
}

function listRisks({ category, status } = {}) {
  const risks = riskRepository.findAll({ category, status });
  const mitigations = mitigationRepository.findByRiskIds(risks.map((r) => r.id));

  const mitigationsByRiskId = new Map();
  for (const mitigation of mitigations) {
    const list = mitigationsByRiskId.get(mitigation.riskId) || [];
    list.push(mitigation);
    mitigationsByRiskId.set(mitigation.riskId, list);
  }

  return risks
    .map((risk) => toRiskResponse(risk, mitigationsByRiskId.get(risk.id) || []))
    .sort((a, b) => b.residualScore - a.residualScore);
}

function getRiskById(id) {
  const risk = riskRepository.findById(id);
  if (!risk) {
    throw new NotFoundError(`Risk with id ${id} was not found`);
  }

  const mitigations = mitigationRepository.findByRiskId(id);
  return toRiskResponse(risk, mitigations);
}

function updateRisk(id, data) {
  const existing = riskRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Risk with id ${id} was not found`);
  }

  const mitigations = mitigationRepository.findByRiskId(id);
  assertCanClose(data.status, mitigations.length);

  const updated = riskRepository.update(id, data);
  // Residual is always derived from current mitigations (not stored).
  return toRiskResponse(updated, mitigations);
}

function deleteRisk(id) {
  const existing = riskRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Risk with id ${id} was not found`);
  }

  // Mitigations are removed by SQLite ON DELETE CASCADE.
  riskRepository.remove(id);
  return { id: Number(id), deleted: true };
}

module.exports = {
  createRisk,
  listRisks,
  getRiskById,
  updateRisk,
  deleteRisk,
  toRiskResponse,
};
