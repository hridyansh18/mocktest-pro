import crypto from 'crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Trust the first proxy hop (needed for correct req.ip / rate limiting when
// deployed behind a load balancer or reverse proxy like Nginx/Render/Railway).
app.set('trust proxy', 1);

// --- Security headers ---
app.disable('x-powered-by');
app.use((req, res, next) => {
  req.requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: env.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  })
);

// --- CORS: only the configured client origin may call this API with credentials ---
const corsOptions = {
  origin(origin, callback) {
    // Requests without Origin are server-to-server/health checks.
    if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// --- Body parsing ---
app.use(express.json({ limit: '2mb' })); // 2mb accommodates CSV bulk-import payloads
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// --- Request logging ---
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// --- Global rate limiting (stricter limiters are layered on top for auth/test-access) ---
app.use('/api', generalLimiter);

// --- API routes ---
app.use('/api', apiRouter);

// --- 404 + global error handler (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
