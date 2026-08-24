/**
 * Centralised input sanitization for all user-supplied text.
 *
 * Strategy:
 * - Validation via express-validator at the controller boundary
 *   is the PRIMARY defense — reject bad input before it enters the system.
 * - This service is the SECONDARY defense for values that pass validation
 *   but might still contain dangerous content when rendered elsewhere
 *   (e.g. notification body shown in email HTML).
 *
 * We do NOT sanitize inputs destined for SQL — that's handled entirely
 * by Prisma parameterized queries. Sanitizing for SQL is the wrong approach
 * because it's fragile; parameterization is the correct approach.
 *
 * We DO sanitize inputs that will be:
 * 1. Inserted into HTML (email templates, WebSocket JSON)
 * 2. Stored in JSON columns and later rendered
 * 3. Used in log messages
 */

// Patterns for detecting injection attempts — used for logging/alerting,
// not for blocking (blocking is done by validation)
const SQL_INJECTION_PATTERN = /(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)/i;

const HTML_INJECTION_PATTERN = /<[^>]*>|javascript:|vbscript:|data:text\/html/i;

const PATH_TRAVERSAL_PATTERN = /\.\.\/|\.\\\\|%2e%2e|%252e%252e/i;

const AMP = '&' + 'amp;';
const LT = '&' + 'lt;';
const GT = '&' + 'gt;';
const QUOT = '&' + 'quot;';
const HX27 = '&#' + 'x27;';
const HX2F = '&#' + 'x2F;';

/**
 * HTML-escapes a string for safe insertion into HTML contexts.
 * Use for: email bodies, any field rendered in a browser.
 *
 * This is encode-on-output, not strip-on-input —
 * the original value is preserved in the DB; only the rendered form is escaped.
 */
export function escapeHtml(input: string | null | undefined): string | null {
  if (input == null) return null;
  return input
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, HX27)
    .replace(/\//g, HX2F);
}

/**
 * Strips all HTML tags from input.
 * Use for: fields where HTML is never valid (names, descriptions).
 * More aggressive than escaping — removes the tag structure entirely.
 */
export function stripHtml(input: string | null | undefined): string | null {
  if (input == null) return null;
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitizes a string for safe inclusion in log messages.
 * Prevents log injection — a user submitting newlines in their name
 * could fake log entries.
 *
 * Security: OWASP recommends encoding newlines in log output.
 */
export function sanitizeForLog(input: string | null | undefined): string {
  if (input == null) return 'null';
  return input
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    // Truncate long values to prevent log flooding
    .substring(0, Math.min(input.length, 200));
}

/**
 * Masks a credit card number for display/logging.
 * Shows only last 4 digits: ****-****-****-1234
 */
export function maskCardNumber(cardNumber: string | null | undefined): string {
  if (cardNumber == null || cardNumber.length < 4) return '****';
  const digits = cardNumber.replace(/[^0-9]/g, '');
  if (digits.length < 4) return '****';
  return '****-****-****-' + digits.substring(digits.length - 4);
}

/**
 * Masks an email address for display/logging.
 * user@example.com → u***@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (email == null || !email.includes('@')) return '****';
  const atIdx = email.indexOf('@');
  if (atIdx <= 1) return '****' + email.substring(atIdx);
  return email.charAt(0) + '***' + email.substring(atIdx);
}

/**
 * Masks all but last 4 chars of any sensitive value.
 * Use for: account numbers, national IDs, tax IDs.
 */
export function maskSensitive(value: string | null | undefined): string {
  if (value == null || value.length < 4) return '****';
  return '*'.repeat(value.length - 4) + value.substring(value.length - 4);
}

/**
 * Detects potential injection attempts in input.
 * Used to log suspicious activity — does NOT block the request
 * (blocking is the responsibility of express-validator constraints).
 *
 * @returns true if suspicious patterns detected
 */
export function containsSuspiciousContent(input: string | null | undefined): boolean {
  if (input == null) return false;
  return (
    SQL_INJECTION_PATTERN.test(input) ||
    HTML_INJECTION_PATTERN.test(input) ||
    PATH_TRAVERSAL_PATTERN.test(input)
  );
}