import winston from 'winston';
import path    from 'path';
import fs      from 'fs';
import { env } from '../config/env';

// ─── Ensure logs directory exists ────────────────────────────────
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ─── Custom Format ────────────────────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${String(timestamp)}] ${level}: ${String(message)}${metaStr}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ─── Transports ───────────────────────────────────────────────────
const transports: winston.transport[] = [
  // Combined log
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format:   fileFormat,
    maxsize:  10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
  // Error-only log
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level:    'error',
    format:   fileFormat,
    maxsize:  10 * 1024 * 1024,
    maxFiles: 5,
    tailable: true,
  }),
];

// Console transport in non-production
if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({ format: consoleFormat }),
  );
} else {
  // Production: JSON to stdout for log aggregators
  transports.push(
    new winston.transports.Console({ format: fileFormat }),
  );
}

// ─── Logger Instance ──────────────────────────────────────────────
export const logger = winston.createLogger({
  level:            env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels:           winston.config.npm.levels,
  defaultMeta:      { service: 'ai-voice-recorder-api' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format:   fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format:   fileFormat,
    }),
  ],
  exitOnError: false,
});

// ─── Stream for Morgan HTTP logging ──────────────────────────────
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
