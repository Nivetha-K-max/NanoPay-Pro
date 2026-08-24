import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import contactRoutes from './routes/contacts.js';
import userRoutes from './routes/users.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { requestTracing } from './middleware/requestTracing.js';
import { httpsEnforcement } from './middleware/httpsEnforcement.js';
import { sqlInjectionAudit } from './middleware/sqlInjectionAudit.js';
import { validateSecrets } from './security/secretsValidation.js';

dotenv.config();

// ── Fail-fast secrets validation ──────────────────────────────────────────
// Validates JWT secret, encryption key, DB password before starting.
// An app running without proper secrets is worse than one that won't start.
try {
  validateSecrets();
} catch (err) {
  console.error(err);
  process.exit(1);
}

const app = express();
const PORT = process.env.API_PORT || 5000;

/*
 * CSRF Protection Decision:
 *
 * CSRF disabled — this is CORRECT and SECURE for this API because:
 *
 * 1. We use JWT in the Authorization header (not cookies).
 *    CSRF attacks work by exploiting the browser's automatic cookie attachment.
 *    Since our auth token is in a custom header, browsers won't attach it
 *    cross-origin without CORS permission.
 *
 * 2. Our CORS config restricts allowed origins to the frontend domain only.
 *    A malicious site on evil.com cannot make credentialed requests to our API
 *    because the browser enforces CORS — the preflight request is rejected.
 *
 * If we ever add cookie-based auth (e.g. HttpOnly refresh token cookie),
 * we must re-enable CSRF protection for those endpoints.
 *
 * Reference: https://docs.expressjs.com/en/guide/security.html
 */

// ── Security middleware stack ──────────────────────────────────────────────
// Order matters: each layer builds on the previous one.

// 1. Helmet — sets various HTTP security headers (X-Frame-Options, CSP, etc.)
app.use(helmet({
  // CSP is handled by our custom securityHeaders middleware for API control
  contentSecurityPolicy: false,
  // HSTS is handled by our custom middleware
  strictTransportSecurity: false,
}));

// 2. HTTPS enforcement — redirect HTTP to HTTPS in production
app.use(httpsEnforcement);

// 3. Request tracing — adds traceId, requestId, and structured logging
app.use(requestTracing);

// 4. Security headers — additional headers not covered by helmet
app.use(securityHeaders);

// 5. SQL injection audit — logs suspicious input patterns
app.use(sqlInjectionAudit);

// 6. Standard middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));   // Limit body size to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/users', userRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const log = (req as any).log || console;
  log.error('Unhandled error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    requestId: (req as any).requestId,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NanoPay API server running on http://localhost:${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});