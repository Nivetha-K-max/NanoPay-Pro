import winston from 'winston';
import path from 'path';
import { maskingFormat } from './maskingFormat.js';

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

/**
 * Winston logger with sensitive data masking.
 *
 * Security principle: logs are often stored in less-secure systems
 * (ELK, CloudWatch, Splunk) with broader access than the DB.
 * We must never log: passwords, JWT tokens, card numbers, SSNs,
 * full email addresses, or account balances in error contexts.
 *
 * The maskingFormat transform replaces sensitive field values with [REDACTED]
 * before the log line is written to any transport.
 */

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, traceId, ...meta }) => {
      const trace = traceId ? ` [${traceId}]` : '';
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} ${level}${trace}: ${message}${metaStr}`;
    })
  ),
});

const fileTransport = new winston.transports.File({
  filename: path.join(logDir, 'app.log'),
  maxsize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

const errorFileTransport = new winston.transports.File({
  filename: path.join(logDir, 'error.log'),
  level: 'error',
  maxsize: 100 * 1024 * 1024,
  maxFiles: 30,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'prod' ? 'warn' : 'info'),
  format: winston.format.combine(
    maskingFormat(),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: { service: 'nanopay-api' },
  transports: [consoleTransport, fileTransport, errorFileTransport],
  // Never exit on uncaught exceptions — let the process manager handle it
  exitOnError: false,
});

/**
 * Creates a child logger with request-scoped context (traceId, userId, etc.)
 */
export function createRequestLogger(traceId: string, userId?: string) {
  return logger.child({ traceId, userId });
}