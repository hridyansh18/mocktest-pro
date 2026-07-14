import dotenv from 'dotenv';

dotenv.config();

const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ATTEMPT_SECRET'
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  // Fail fast and loudly rather than booting with undefined secrets.
  // eslint-disable-next-line no-console
  console.error(
    `[env] Missing required environment variables: ${missing.join(', ')}\n` +
      '[env] Copy server/.env.example to server/.env and fill in real values.'
  );
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',').map((value) => value.trim()).filter(Boolean),

  databaseUrl: process.env.DATABASE_URL,
  pgSsl: process.env.PGSSL === 'true',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    attemptSecret: process.env.JWT_ATTEMPT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 10
  },

  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
  testCodePrefixDefault: process.env.TEST_CODE_PREFIX_DEFAULT || 'TST',
  logLevel: process.env.LOG_LEVEL || 'info'
};

export default env;
