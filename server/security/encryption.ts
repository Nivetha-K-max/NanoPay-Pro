import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const NONCE_SIZE = 12;   // 96 bits — NIST recommended
const TAG_SIZE = 16;     // 128 bits
const KEY_SIZE = 32;     // bytes (256 bits)

let secretKey: Buffer | null = null;

/**
 * Initializes the encryption key from a Base64-encoded string.
 * Must be called before encrypt/decrypt.
 *
 * In dev: generates an ephemeral key (data won't survive restart).
 * In prod: must be set via ENCRYPTION_KEY env var.
 *
 * Generate with: openssl rand -base64 32
 */
export function initEncryption(base64Key?: string): void {
  if (base64Key && base64Key.trim() !== '') {
    const keyBytes = Buffer.from(base64Key, 'base64');
    if (keyBytes.length !== KEY_SIZE) {
      throw new Error(
        `Encryption key must be exactly 32 bytes (256-bit AES). ` +
        `Got ${keyBytes.length} bytes. ` +
        `Generate with: openssl rand -base64 32`
      );
    }
    secretKey = keyBytes;
  } else {
    // Dev mode: generate ephemeral key
    console.warn(
      'SECURITY: No encryption key configured. ' +
      'Using ephemeral key — encrypted data will not survive restart. ' +
      'Set ENCRYPTION_KEY environment variable in production.'
    );
    secretKey = crypto.randomBytes(KEY_SIZE);
  }
}

function getKey(): Buffer {
  if (!secretKey) {
    initEncryption(process.env.ENCRYPTION_KEY);
  }
  if (!secretKey) {
    throw new Error('Encryption not initialized. Call initEncryption() first.');
  }
  return secretKey;
}

/**
 * Encrypts plaintext and returns Base64-encoded ciphertext.
 * Returns null if input is null (nullable DB columns).
 *
 * Format: Base64(nonce[12] + ciphertext + tag[16])
 * The nonce is prepended to the ciphertext so each encrypted value
 * is self-contained and independently decryptable.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;

  const key = getKey();
  const nonce = crypto.randomBytes(NONCE_SIZE);

  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: nonce + ciphertext + tag
  const packed = Buffer.concat([nonce, encrypted, tag]);
  return packed.toString('base64');
}

/**
 * Decrypts a Base64-encoded ciphertext produced by encrypt().
 * Throws if the ciphertext has been tampered with (GCM integrity check).
 */
export function decrypt(encryptedBase64: string | null | undefined): string | null {
  if (encryptedBase64 == null) return null;

  const key = getKey();
  const packed = Buffer.from(encryptedBase64, 'base64');

  const nonce = packed.subarray(0, NONCE_SIZE);
  const tag = packed.subarray(packed.length - TAG_SIZE);
  const ciphertext = packed.subarray(NONCE_SIZE, packed.length - TAG_SIZE);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, nonce);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString('utf-8');
  } catch (err) {
    if (err instanceof Error && err.message.includes('auth')) {
      // Integrity check failed — data has been tampered with
      console.error(
        'SECURITY: Decryption integrity check failed — ' +
        'data may have been tampered with'
      );
      throw new Error('Data integrity violation');
    }
    throw new Error('Decryption failed');
  }
}

/**
 * Returns true if the value appears to be encrypted by this service.
 * Used to detect unencrypted legacy data in migration scenarios.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (value == null) return false;
  try {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length > NONCE_SIZE;
  } catch {
    return false;
  }
}