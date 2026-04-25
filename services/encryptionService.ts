/**
 * Encryption Service
 * Provides field-level encryption for sensitive data using AES-256-GCM
 * Sensitive fields: ID numbers, KRA PIN, license plates, bank account info
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'hex';
const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12;
const SALT_LENGTH = 32;

export interface EncryptedField {
  iv: string;
  salt: string;
  authTag: string;
  encryptedData: string;
  algorithm: string;
}

/**
 * Derive a key from a master key using PBKDF2
 * Unique salt per field ensures different ciphertexts for same plaintext
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt sensitive field with AES-256-GCM
 * @param plaintext - The sensitive data to encrypt
 * @param masterKey - Encryption master key (from environment/secrets manager)
 * @returns Encrypted data structure with all necessary components for decryption
 */
export function encryptField(plaintext: string, masterKey: string): EncryptedField {
  if (!plaintext) return null as any;
  if (!masterKey || masterKey.length < 32) {
    throw new Error('Encryption master key must be at least 32 characters');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encryptedData = cipher.update(plaintext, 'utf8', ENCODING);
  encryptedData += cipher.final(ENCODING);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString(ENCODING),
    salt: salt.toString(ENCODING),
    authTag: authTag.toString(ENCODING),
    encryptedData,
    algorithm: ALGORITHM,
  };
}

/**
 * Decrypt sensitive field
 * @param encrypted - Encrypted data structure from encryptField()
 * @param masterKey - Same master key used for encryption
 * @returns Decrypted plaintext
 */
export function decryptField(encrypted: EncryptedField, masterKey: string): string {
  if (!encrypted || !encrypted.encryptedData) {
    return '';
  }

  try {
    const salt = Buffer.from(encrypted.salt, ENCODING);
    const iv = Buffer.from(encrypted.iv, ENCODING);
    const authTag = Buffer.from(encrypted.authTag, ENCODING);
    const key = deriveKey(masterKey, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.encryptedData, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption failed (possible tampering)', error);
    throw new Error('Decryption failed - data may be corrupted or tampered');
  }
}

/**
 * Hash sensitive data for searching/matching without decryption
 * Uses HMAC-SHA256 with a separate hashing key
 * @param plaintext - Data to hash
 * @param hashKey - Separate key for hashing
 * @returns Hex-encoded hash
 */
export function hashField(plaintext: string, hashKey: string): string {
  if (!plaintext) return '';
  return crypto
    .createHmac('sha256', hashKey)
    .update(plaintext)
    .digest('hex');
}

/**
 * Verify hash matches plaintext (for authentication without storing plaintext)
 */
export function verifyHashField(plaintext: string, hash: string, hashKey: string): boolean {
  const computedHash = hashField(plaintext, hashKey);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

/**
 * Fields that should be encrypted in user/driver records
 */
export const ENCRYPTED_FIELDS = {
  USER: ['idNumber', 'kraPin', 'licenseNumber', 'bankAccountNumber'],
  VEHICLE: ['plate', 'vinNumber'],
  DELIVERY_NOTE: [],
} as const;

/**
 * Check if a field should be encrypted
 */
export function shouldEncryptField(entity: 'USER' | 'VEHICLE' | 'DELIVERY_NOTE', fieldName: string): boolean {
  return (ENCRYPTED_FIELDS[entity] as readonly string[]).includes(fieldName);
}

/**
 * Sanitize encrypted data for logging (never log plaintext or raw encrypted values)
 */
export function sanitizeEncryptedField(encrypted: EncryptedField): string {
  if (!encrypted) return '[null]';
  return `[ENCRYPTED:${encrypted.algorithm}:${encrypted.encryptedData.slice(0, 16)}...]`;
}

/**
 * Generate a cryptographically secure random token (for API keys, session tokens, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create HMAC signature for request authentication
 */
export function createHmacSignature(payload: any, secret: string): string {
  const message = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(payload: any, signature: string, secret: string): boolean {
  const expectedSignature = createHmacSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
