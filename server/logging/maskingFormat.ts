import winston from 'winston';

const REDACTED = '[REDACTED]';

const patterns: { regex: RegExp; replacement: string }[] = [
  // JWT tokens
  {
    regex: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    replacement: '[JWT_TOKEN]',
  },
  // Password fields in JSON
  {
    regex: /"(?:password|passwordHash|currentPassword|newPassword)"\s*:\s*"[^"]+"/gi,
    replacement: '"password":"[REDACTED]"',
  },
  // Credit card numbers (13-19 digits, with optional spaces/dashes)
  {
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    replacement: '[CARD_NUMBER]',
  },
  // Authorization header value
  {
    regex: /Authorization:\s*Bearer\s+[A-Za-z0-9_.\-]+/gi,
    replacement: 'Authorization: Bearer [REDACTED]',
  },
  // Refresh token fields in JSON
  {
    regex: /"refreshToken"\s*:\s*"[^"]+"/gi,
    replacement: '"refreshToken":"[REDACTED]"',
  },
  // Secret/key fields
  {
    regex: /"(?:secret|apiKey|api_key|webhookSecret|tokenHash)"\s*:\s*"[^"]+"/gi,
    replacement: '"secret":"[REDACTED]"',
  },
  // Tax IDs
  {
    regex: /"taxId"\s*:\s*"[^"]+"/gi,
    replacement: '"taxId":"[REDACTED]"',
  },
];

/**
 * Winston format that masks sensitive values in log messages.
 *
 * Plugged into logger.ts as maskingFormat().
 * Applies regex substitution to the formatted message before it's written.
 *
 * Patterns covered:
 * - JWT tokens (eyJ... format)
 * - Passwords in JSON bodies
 * - Credit card numbers (16 digit sequences)
 * - Authorization header values
 * - Refresh token values
 *
 * Security note: this is a last-resort safety net.
 * Developers should never log sensitive data in the first place.
 * This format catches accidental logging during debugging.
 */
export function maskingFormat() {
  return winston.format((info: winston.Logform.TransformableInfo) => {
    const msg = info.message;
    if (typeof msg === 'string') {
      for (const { regex, replacement } of patterns) {
        info.message = msg.replace(regex, replacement);
      }
    }

    // Also mask any string values in the metadata object
    if (info.meta && typeof info.meta === 'object') {
      const maskedMeta = maskSensitiveFields(info.meta as Record<string, unknown>);
      Object.assign(info, maskedMeta);
    }

    return info;
  })();
}

/**
 * Recursively masks sensitive fields in an object.
 */
function maskSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password', 'passwordHash', 'currentPassword', 'newPassword',
    'token', 'jwt', 'secret', 'apiKey', 'api_key', 'refreshToken',
    'tokenHash', 'webhookSecret', 'taxId', 'ssn', 'cardNumber',
    'authorization',
  ];

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.includes(key)) {
      result[key] = REDACTED;
    } else if (typeof value === 'string') {
      // Apply regex patterns to string values too
      let masked = value;
      for (const { regex, replacement } of patterns) {
        masked = masked.replace(regex, replacement);
      }
      result[key] = masked;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = maskSensitiveFields(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}