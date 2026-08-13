const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateInherentRisk,
  getSeverityBand,
  calculateResidualRisk,
} = require('../src/utils/riskCalculations');

describe('calculateInherentRisk', () => {
  const cases = [];
  for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
    for (let impact = 1; impact <= 5; impact += 1) {
      cases.push({ likelihood, impact, expected: likelihood * impact });
    }
  }

  for (const { likelihood, impact, expected } of cases) {
    it(`likelihood ${likelihood} × impact ${impact} = ${expected}`, () => {
      assert.equal(calculateInherentRisk(likelihood, impact), expected);
    });
  }

  it('covers corner combinations explicitly', () => {
    assert.equal(calculateInherentRisk(1, 1), 1);
    assert.equal(calculateInherentRisk(1, 5), 5);
    assert.equal(calculateInherentRisk(5, 1), 5);
    assert.equal(calculateInherentRisk(3, 3), 9);
    assert.equal(calculateInherentRisk(4, 5), 20);
    assert.equal(calculateInherentRisk(5, 5), 25);
  });
});

describe('getSeverityBand', () => {
  it('maps severity boundaries', () => {
    assert.equal(getSeverityBand(1), 'Low');
    assert.equal(getSeverityBand(5), 'Low');
    assert.equal(getSeverityBand(6), 'Medium');
    assert.equal(getSeverityBand(12), 'Medium');
    assert.equal(getSeverityBand(13), 'High');
    assert.equal(getSeverityBand(19), 'High');
    assert.equal(getSeverityBand(20), 'Critical');
    assert.equal(getSeverityBand(25), 'Critical');
  });

  it('maps interior values in each band', () => {
    assert.equal(getSeverityBand(3), 'Low');
    assert.equal(getSeverityBand(9), 'Medium');
    assert.equal(getSeverityBand(16), 'High');
    assert.equal(getSeverityBand(22), 'Critical');
  });
});

describe('calculateResidualRisk', () => {
  it('returns inherent risk when there are no mitigations', () => {
    assert.equal(calculateResidualRisk(20, []), 20);
    assert.equal(calculateResidualRisk(20, null), 20);
    assert.equal(calculateResidualRisk(20, undefined), 20);
  });

  it('applies 10% reduction for effectiveness 1', () => {
    // 20 × (1 - 0.1) = 18
    assert.equal(calculateResidualRisk(20, [{ effectiveness: 1 }]), 18);
  });

  it('applies 50% reduction for effectiveness 5', () => {
    // 20 × (1 - 0.5) = 10
    assert.equal(calculateResidualRisk(20, [{ effectiveness: 5 }]), 10);
  });

  it('uses the highest effectiveness among multiple mitigations', () => {
    const mitigations = [
      { effectiveness: 4 },
      { effectiveness: 5 },
      { effectiveness: 2 },
    ];
    // strongest = 5 → 50% → 20 × 0.5 = 10
    assert.equal(calculateResidualRisk(20, mitigations), 10);
  });

  it('never returns a residual below 1', () => {
    assert.equal(calculateResidualRisk(1, [{ effectiveness: 5 }]), 1);
    assert.equal(calculateResidualRisk(2, [{ effectiveness: 5 }]), 1);
    assert.equal(calculateResidualRisk(3, [{ effectiveness: 5 }]), 2);

    for (let inherent = 1; inherent <= 25; inherent += 1) {
      for (let effectiveness = 1; effectiveness <= 5; effectiveness += 1) {
        const residual = calculateResidualRisk(inherent, [{ effectiveness }]);
        assert.ok(residual >= 1, `residual ${residual} for inherent ${inherent}, effectiveness ${effectiveness}`);
      }
    }
  });

  it('rounds residual to the nearest integer', () => {
    // 9 × 0.7 = 6.3 → 6 (effectiveness 3 = 30%)
    assert.equal(calculateResidualRisk(9, [{ effectiveness: 3 }]), 6);
    // 15 × 0.6 = 9 (effectiveness 4 = 40%)
    assert.equal(calculateResidualRisk(15, [{ effectiveness: 4 }]), 9);
  });
});
