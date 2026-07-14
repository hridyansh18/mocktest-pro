import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const configureLiveMonitorSocket = (io) => {
  const namespace = io.of('/live-monitor');

  namespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.jwt.accessSecret);
      if (payload.role !== 'admin') return next(new Error('Admin access required'));
      socket.adminAuth = payload;
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  namespace.on('connection', (socket) => {
    socket.on('test:join', ({ testId }) => {
      if (typeof testId === 'string' && testId.length <= 100) socket.join(`test:${testId}`);
    });
    socket.on('test:leave', ({ testId }) => socket.leave(`test:${testId}`));
  });

  return namespace;
};
