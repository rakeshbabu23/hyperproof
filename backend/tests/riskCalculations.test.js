const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateInherentRisk,
  getSeverityBand,
  calculateResidualRisk,
} = require('../src/utils/riskCalculations');

describe('calculateInherentRisk', () => {
  it('1 × 1 = 1', () => {
    assert.equal(calculateInherentRisk(1, 1), 1);
  });

  it('4 × 5 = 20', () => {
    assert.equal(calculateInherentRisk(4, 5), 20);
  });

  it('5 × 5 = 25', () => {
    assert.equal(calculateInherentRisk(5, 5), 25);
  });
});

describe('getSeverityBand', () => {
  it('maps severity band boundaries', () => {
    assert.equal(getSeverityBand(1), 'Low');
    assert.equal(getSeverityBand(5), 'Low');
    assert.equal(getSeverityBand(6), 'Medium');
    assert.equal(getSeverityBand(12), 'Medium');
    assert.equal(getSeverityBand(13), 'High');
    assert.equal(getSeverityBand(19), 'High');
    assert.equal(getSeverityBand(20), 'Critical');
    assert.equal(getSeverityBand(25), 'Critical');
  });
});

describe('calculateResidualRisk', () => {
  it('equals inherent risk when there are zero mitigations', () => {
    assert.equal(calculateResidualRisk(20, []), 20);
    assert.equal(calculateResidualRisk(20, null), 20);
  });

  it('applies 10% reduction for effectiveness 1', () => {
    assert.equal(calculateResidualRisk(20, [{ effectiveness: 1 }]), 18);
  });

  it('applies 50% reduction for effectiveness 5', () => {
    assert.equal(calculateResidualRisk(20, [{ effectiveness: 5 }]), 10);
  });

  it('uses only the strongest mitigation when multiple exist', () => {
    const mitigations = [
      { effectiveness: 2 },
      { effectiveness: 5 },
      { effectiveness: 3 },
    ];
    assert.equal(calculateResidualRisk(20, mitigations), 10);
  });

  it('never returns a residual below 1', () => {
    assert.equal(calculateResidualRisk(1, [{ effectiveness: 5 }]), 1);
    assert.equal(calculateResidualRisk(2, [{ effectiveness: 5 }]), 1);
  });
});
