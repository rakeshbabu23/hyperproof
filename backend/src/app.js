const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const riskRoutes = require('./routes/riskRoutes');
const mitigationRoutes = require('./routes/mitigationRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.use('/risks', riskRoutes);
app.use('/mitigations', mitigationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

app.use(errorHandler);

module.exports = app;
