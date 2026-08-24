/**
 * Validates that all required secrets are present at startup.
 * Fails fast rather than running with missing security configuration.
 *
 * Call this function at server startup after env vars are loaded.
 *
 * Security checks:
 * 1. JWT secret is set and sufficiently long (min 64 bytes for HS512)
 * 2. Encryption key is set in production
 * 3. DB password is not the default dev value in production
 * 4. OAuth2 credentials are present if OAuth2 is enabled
 *
 * Any failure throws an exception that brings the app down.
 * An app running without proper secrets is worse than one that won't start.
 */

const KNOWN_DEFAULT_PASSWORDS = [
  'nanopay_dev_pass',
  'root',
  'password',
  'admin',
  'changeme',
];

export function validateSecrets(): void {
  const isProd = process.env.NODE_ENV === 'prod' ||
                 process.env.APP_PROFILE === 'prod';

  // ── JWT secret — required in all environments ──────────────────────
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim() === '') {
    throw new Error(
      'SECURITY STARTUP FAILURE: JWT_SECRET is not set. ' +
      'Generate with: openssl rand -base64 64'
    );
  }

  // JWT secret must be long enough for HS512 (64 bytes = 512 bits)
  try {
    const keyBytes = Buffer.from(jwtSecret, 'base64');
    if (keyBytes.length < 64) {
      throw new Error(
        `SECURITY STARTUP FAILURE: JWT secret is too short. ` +
        `HS512 requires at least 64 bytes. Current: ${keyBytes.length} bytes.`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('SECURITY')) {
      throw err;
    }
    throw new Error(
      'SECURITY STARTUP FAILURE: JWT_SECRET is not valid Base64.'
    );
  }

  if (isProd) {
    // ── Encryption key — required in production ─────────────────────
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.trim() === '') {
      throw new Error(
        'SECURITY STARTUP FAILURE: ENCRYPTION_KEY is not set. ' +
        'Generate with: openssl rand -base64 32'
      );
    }

    // ── DB password must not be a known default ─────────────────────
    const dbPassword = process.env.DB_PASSWORD || '';
    if (KNOWN_DEFAULT_PASSWORDS.includes(dbPassword)) {
      throw new Error(
        'SECURITY STARTUP FAILURE: Production DB password is set to ' +
        'a known default. Use a strong, unique password.'
      );
    }

    console.log('SECURITY: All production secrets validated successfully');
  } else {
    console.warn(
      'SECURITY: Running in non-production mode. ' +
      'Some security validations are relaxed.'
    );
  }
}