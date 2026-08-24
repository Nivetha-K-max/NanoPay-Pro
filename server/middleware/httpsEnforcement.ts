import type { Request, Response, NextFunction } from 'express';

/**
 * Forces HTTP → HTTPS redirect at the Express level.
 *
 * Only active when HTTPS_ENFORCE=true (prod profile).
 * In dev/test: HTTP is fine and this middleware is a no-op.
 *
 * In production with a load balancer:
 * - The load balancer (nginx/ALB) terminates TLS
 * - Internal traffic between LB and app can be HTTP
 * - Set HTTPS_ENFORCE=false when LB handles TLS
 */
export function httpsEnforcement(req: Request, res: Response, next: NextFunction): void {
  const enforce = process.env.HTTPS_ENFORCE === 'true';

  if (!enforce) {
    return next();
  }

  // Trust X-Forwarded-Proto when behind a load balancer
  const proto =
    req.headers['x-forwarded-proto']?.toString().toLowerCase() ||
    req.protocol;

  if (proto !== 'https') {
    const host = req.headers.host || 'localhost';
    // Redirect with 301 to HTTPS
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  next();
}

/**
 * Add HSTS header for HTTPS enforcement
 * This is already in securityHeaders middleware, but this provides
 * an additional layer for direct HTTPS checks.
 */
export function hstsCheck(req: Request, res: Response, next: NextFunction): void {
  const enforce = process.env.HTTPS_ENFORCE === 'true';
  if (enforce) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
}