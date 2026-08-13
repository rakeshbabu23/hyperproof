const RISK_CATEGORIES = Object.freeze([
  'Operational',
  'Financial',
  'Compliance',
  'Security',
  'Strategic',
]);

const RISK_STATUSES = Object.freeze(['Open', 'Mitigating', 'Closed']);

module.exports = {
  RISK_CATEGORIES,
  RISK_STATUSES,
};
