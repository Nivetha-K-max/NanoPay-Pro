import type { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 *
 * Adds security headers to every HTTP response.
 * These headers defend against a class of attacks that Express's built-in
 * support doesn't fully cover.
 *
 * Runs early in the middleware chain — headers are set regardless of auth outcome.
 *
 * Security headers explained:
 *
 * X-Content-Type-Options: nosniff
 *   Prevents MIME-type sniffing. Without this, a browser might execute
 *   a response with Content-Type: text/plain as JavaScript if it "looks like" JS.
 *
 * X-Frame-Options: DENY
 *   Prevents clickjacking — embedding our pages in an iframe on another domain.
 *
 * Strict-Transport-Security
 *   Forces HTTPS for 1 year. includeSubDomains covers *.nanopay.com.
 *   preload submits us to the browser preload list — HTTP is never tried.
 *
 * Permissions-Policy
 *   Disables browser features we don't need.
 *   Prevents a compromised third-party script from accessing camera/mic/location.
 *
 * Referrer-Policy: strict-origin-when-cross-origin
 *   Full URL sent for same-origin requests (for analytics).
 *   Only origin (no path) sent cross-origin — prevents leaking transaction IDs
 *   in Referer headers when users click external links from a transaction page.
 *
 * Cache-Control: no-store
 *   Prevents sensitive API responses from being cached in browser history,
 *   proxy caches, or CDN edge nodes.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // ── Transport security ─────────────────────────────────────────────
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // ── Clickjacking protection ────────────────────────────────────────
  res.setHeader('X-Frame-Options', 'DENY');

  // ── MIME sniffing ──────────────────────────────────────────────────
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // ── Content Security Policy ────────────────────────────────────────
  // API responses are JSON — no HTML content rendered.
  // This CSP is strict because the API never serves HTML to browsers.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );

  // ── Referrer control ───────────────────────────────────────────────
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ── Feature/permissions policy ─────────────────────────────────────
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), ' +
    'payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // ── Cache control for API responses ───────────────────────────────
  // Applied only to API endpoints — static assets need their own cache policy
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // ── Remove server fingerprinting headers ───────────────────────────
  // Express adds X-Powered-By by default — strip it
  res.removeHeader('X-Powered-By');

  next();
}