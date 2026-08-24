import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logging/logger.js';

const TRACE_HEADER = 'X-Trace-Id';
const REQUEST_HEADER = 'X-Request-Id';

/**
 * Adds correlation IDs to every request.
 *
 * Fields added to logs via logger.child:
 * - traceId:   UUID per request (correlates across microservices if forwarded)
 * - requestId: same as traceId (HTTP response header for client-side correlation)
 * - userId:    authenticated user ID (if authenticated)
 * - method:    HTTP method
 * - uri:       request path (without query string to avoid logging sensitive params)
 *
 * Security: query strings are intentionally excluded — they may contain
 * tokens or PII in GET parameters.
 */
export function requestTracing(req: Request, res: Response, next: NextFunction): void {
  // Accept incoming trace ID from load balancer/API gateway, or generate one
  let traceId = req.headers[TRACE_HEADER.toLowerCase()] as string | undefined;
  if (!traceId || traceId.trim() === '') {
    traceId = uuidv4().replace(/-/g, '').substring(0, 16);
  }

  const requestId = uuidv4().substring(0, 8);

  // Attach to request for downstream use
  req.traceId = traceId;
  req.requestId = requestId;

  // Set response headers
  res.setHeader(TRACE_HEADER, traceId);
  res.setHeader(REQUEST_HEADER, requestId);

  // Create a child logger for this request
  req.log = logger.child({
    traceId,
    requestId,
    method: req.method,
    uri: req.path, // no query string
  });

  // Log request start
  req.log.info(`--> ${req.method} ${req.path}`);

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - (req._startTime?.getTime() || Date.now());
    req.log.info(
      `<-- ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      requestId: string;
      log: ReturnType<typeof logger.child>;
      _startTime?: Date;
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}