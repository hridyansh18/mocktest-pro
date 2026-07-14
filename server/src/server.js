import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { logger } from './utils/logger.js';
import { Server as SocketIOServer } from 'socket.io';
import { configureLiveMonitorSocket } from './sockets/liveMonitorSocket.js';
import { setSocketIO } from './services/liveMonitorService.js';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: env.allowedOrigins, credentials: true }
});
configureLiveMonitorSocket(io);
setSocketIO(io);

const start = async () => {
  try {
    await pool.query('SELECT 1'); // fail fast if DB is unreachable
    logger.info('Database connection verified');

    server.listen(env.port, () => {
      logger.info(`MockTest Pro API listening on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    logger.info('Shutdown complete.');
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});

start();

export default server;
