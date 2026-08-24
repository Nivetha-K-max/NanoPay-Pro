/**
 * Custom validation helpers for express-validator.
 *
 * These provide reusable validation chains for common security-sensitive fields.
 */

/**
 * Pattern for validating safe strings — no HTML tags or script injection.
 */
const DANGEROUS_PATTERN = /<[^>]*>|javascript\s*:|vbscript\s*:|data\s*:text\/html|\x00/i;

/**
 * Validates that a string does not contain HTML tags or script injection.
 *
 * Rejects:
 * - HTML tags: <script>, <img>, <iframe>, any <tag>
 * - JavaScript protocol: javascript:
 * - Data URIs that could execute scripts: data:text/html
 * - Null bytes: \0 (can bypass some filters)
 *
 * Allows:
 * - Normal text, numbers, punctuation
 * - Emoji (valid Unicode)
 * - URLs (https:// links are fine)
 */
export function isSafeString(value: string): boolean {
  if (value == null) return true; // use .notEmpty() separately for required fields
  return !DANGEROUS_PATTERN.test(value);
}

/**
 * Custom error message for safe string validation.
 */
export const SAFE_STRING_MSG = 'Field contains invalid characters';

/**
 * Name validation pattern — only letters, spaces, hyphens, and apostrophes.
 */
export const NAME_PATTERN = /^[a-zA-Z\s\-']+$/;

/**
 * Name validation error message.
 */
export const NAME_MSG = 'Name contains invalid characters';

/**
 * Common validation rules for express-validator.
 *
 * Usage:
 * ```
 * import { body } from 'express-validator';
 * import { safeStringRule, nameRule } from '../security/validators.js';
 *
 * router.post('/register', [
 *   body('firstName').notEmpty().isLength({ min: 2, max: 100 })
 *     .matches(NAME_PATTERN).withMessage(NAME_MSG)
 *     .custom(isSafeString).withMessage(SAFE_STRING_MSG),
 * ], controller);
 * ```
 */