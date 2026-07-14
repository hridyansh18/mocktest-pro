import { env } from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[env.logLevel] ?? LEVELS.info;

const timestamp = () => new Date().toISOString();

const write = (level, ...args) => {
  if (LEVELS[level] > currentLevel) return;
  const line = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(line, ...args);
  } else {
    // eslint-disable-next-line no-console
    console.log(line, ...args);
  }
};

export const logger = {
  error: (...args) => write('error', ...args),
  warn: (...args) => write('warn', ...args),
  info: (...args) => write('info', ...args),
  debug: (...args) => write('debug', ...args)
};

export default logger;
