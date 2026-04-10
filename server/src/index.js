require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocketServer } = require('./websocket/socket');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocketServer(server);

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
  });
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(PORT, () => {
  console.log(`Podwires Community API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
