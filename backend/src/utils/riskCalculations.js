/**
 * Pure risk scoring helpers — no Express, no database.
 */

const EFFECTIVENESS_REDUCTION = Object.freeze({
  1: 0.1,
  2: 0.2,
  3: 0.3,
  4: 0.4,
  5: 0.5,
});

function calculateInherentRisk(likelihood, impact) {
  return likelihood * impact;
}

function getSeverityBand(score) {
  if (score >= 1 && score <= 5) return 'Low';
  if (score >= 6 && score <= 12) return 'Medium';
  if (score >= 13 && score <= 19) return 'High';
  if (score >= 20 && score <= 25) return 'Critical';
  throw new Error(`Score ${score} is outside the valid range 1–25`);
}

/**
 * @param {number} inherentRisk
 * @param {Array<{ effectiveness: number }>|null|undefined} mitigations
 */
function calculateResidualRisk(inherentRisk, mitigations) {
  if (!mitigations || mitigations.length === 0) {
    return inherentRisk;
  }

  const highestEffectiveness = Math.max(
    ...mitigations.map((mitigation) => mitigation.effectiveness),
  );
  const reduction = EFFECTIVENESS_REDUCTION[highestEffectiveness] ?? 0;

  return Math.max(1, Math.round(inherentRisk * (1 - reduction)));
}

module.exports = {
  calculateInherentRisk,
  getSeverityBand,
  calculateResidualRisk,
  EFFECTIVENESS_REDUCTION,
};
