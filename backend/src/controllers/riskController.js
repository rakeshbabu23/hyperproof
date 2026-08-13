const riskService = require('../services/riskService');

function create(req, res) {
  const risk = riskService.createRisk(req.body);
  res.status(201).json({ success: true, data: risk });
}

function list(req, res) {
  const risks = riskService.listRisks({
    category: req.query.category,
    status: req.query.status,
  });
  res.status(200).json({ success: true, data: risks });
}

function getById(req, res) {
  const risk = riskService.getRiskById(req.params.id);
  res.status(200).json({ success: true, data: risk });
}

function update(req, res) {
  const risk = riskService.updateRisk(req.params.id, req.body);
  res.status(200).json({ success: true, data: risk });
}

function remove(req, res) {
  const result = riskService.deleteRisk(req.params.id);
  res.status(200).json({ success: true, data: result });
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
