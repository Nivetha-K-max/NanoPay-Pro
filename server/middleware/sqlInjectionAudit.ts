import type { Request, Response, NextFunction } from 'express';
import { containsSuspiciousContent, sanitizeForLog } from '../security/inputSanitization.js';

/**
 * Middleware that logs suspicious inputs before they reach the service layer.
 *
 * Primary SQL injection defense: Prisma + parameterized queries.
 * Every repository method uses Prisma ORM — never string concatenation.
 * This is enforced by code review, not this middleware.
 *
 * This middleware is the DETECTION layer:
 * - Logs suspicious patterns for security monitoring
 * - Triggers audit events for security review
 * - Does NOT block requests (express-validator handles blocking)
 *
 * Why detect and not block here:
 * Blocking in middleware would bypass the proper validation error
 * response format. express-validator on routes produces structured
 * error responses. Let validation handle blocking; let this handle alerting.
 */
export function sqlInjectionAudit(req: Request, res: Response, next: NextFunction): void {
  // Scan all string values in query params
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && containsSuspiciousContent(value)) {
      const log = req.log || console;
      log.warn(
        'SECURITY_AUDIT: Suspicious content detected in query param. ' +
        `param=${key}, preview=${sanitizeForLog(value.substring(0, 50))}`
      );
    }
  }

  // Scan all string values in body
  if (req.body && typeof req.body === 'object') {
    scanObject(req.body, req);
  }

  // Scan all string values in URL params
  for (const [key, value] of Object.entries(req.params)) {
    if (typeof value === 'string' && containsSuspiciousContent(value)) {
      const log = req.log || console;
      log.warn(
        'SECURITY_AUDIT: Suspicious content detected in URL param. ' +
        `param=${key}, preview=${sanitizeForLog(value.substring(0, 50))}`
      );
    }
  }

  next();
}

/**
 * Recursively scans an object's string values for suspicious content.
 */
function scanObject(obj: Record<string, unknown>, req: Request, depth = 0): void {
  if (depth > 5) return; // Prevent infinite recursion

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && containsSuspiciousContent(value)) {
      const log = req.log || console;
      log.warn(
        'SECURITY_AUDIT: Suspicious content detected in body field. ' +
        `field=${key}, preview=${sanitizeForLog(value.substring(0, 50))}`
      );
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      scanObject(value as Record<string, unknown>, req, depth + 1);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          scanObject(item as Record<string, unknown>, req, depth + 1);
        } else if (typeof item === 'string' && containsSuspiciousContent(item)) {
          const log = req.log || console;
          log.warn(
            'SECURITY_AUDIT: Suspicious content detected in body array. ' +
            `field=${key}, preview=${sanitizeForLog(item.substring(0, 50))}`
          );
        }
      }
    }
  }
}