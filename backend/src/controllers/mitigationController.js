const mitigationService = require('../services/mitigationService');

function create(req, res) {
  const result = mitigationService.createMitigation(req.params.riskId, req.body);
  res.status(201).json({ success: true, data: result });
}

function update(req, res) {
  const result = mitigationService.updateMitigation(req.params.id, req.body);
  res.status(200).json({ success: true, data: result });
}

function remove(req, res) {
  const result = mitigationService.deleteMitigation(req.params.id);
  res.status(200).json({ success: true, data: result });
}

module.exports = {
  create,
  update,
  remove,
};
