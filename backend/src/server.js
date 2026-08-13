const app = require('./app');
const { initDatabase, closeDatabase } = require('./config/database');

const PORT = process.env.PORT || 3001;

initDatabase();

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
