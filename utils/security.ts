import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';

// In a real production app, this would be an environment variable
// SECURITY: This MUST be set as an environment variable. No fallback allowed.
// Fails loudly at startup if VITE_SECURITY_SECRET is not configured.
const _rawSecret = import.meta.env.VITE_SECURITY_SECRET;
if (!_rawSecret || _rawSecret.length < 32) {
  throw new Error(
    '[Shipstack Security] VITE_SECURITY_SECRET is not set or is too short (min 32 chars). ' +
    'Set this environment variable before starting the application. ' +
    'Generate a secure secret with: openssl rand -hex 32'
  );
}
const SECURITY_SECRET: string = _rawSecret;

/**
 * Sanitizes a string to prevent XSS attacks.
 * @param input The raw string input.
 * @returns The sanitized string.
 */
export const sanitize = (input: string): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed for simple inputs
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitizes an object by sanitizing all its string properties.
 * @param obj The object to sanitize.
 * @returns A new object with sanitized string properties.
 */
export const sanitizeObject = <T extends object>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(item => 
      (typeof item === 'object' && item !== null) 
        ? sanitizeObject(item) 
        : (typeof item === 'string' ? sanitize(item) : item)
    ) as any;
  }
  const sanitized = { ...obj } as any;
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitize(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
};

/**
 * Signs a payload using HMAC-SHA256.
 * Used for telemetry integrity.
 */
export const signPayload = (payload: any): string => {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return CryptoJS.HmacSHA256(message, SECURITY_SECRET).toString();
};

/**
 * Verifies a payload signature.
 */
export const verifySignature = (payload: any, signature: string): boolean => {
  const expected = signPayload(payload);
  return expected === signature;
};

/**
 * Encrypts data for secure offline storage.
 */
export const encryptData = (data: any): string => {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(message, SECURITY_SECRET).toString();
};

/**
 * Decrypts data from offline storage.
 * Handles legacy unencrypted data and prevents "Malformed UTF-8 data" errors.
 */
export const decryptData = (ciphertext: string): any => {
  if (!ciphertext) return null;

  // Check if it's already JSON (legacy/unencrypted data)
  if (ciphertext.startsWith('{') || ciphertext.startsWith('[')) {
    try {
      return JSON.parse(ciphertext);
    } catch (e) {
      // Fall through to decryption
    }
  }

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECURITY_SECRET);
    
    // Attempt to convert to UTF-8 string. This is where "Malformed UTF-8 data" usually happens.
    let originalText: string;
    try {
      originalText = bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      // If UTF-8 conversion fails, it's definitely not valid ciphertext for our key
      return fallbackParse(ciphertext);
    }

    if (!originalText) {
      return fallbackParse(ciphertext);
    }

    try {
      return JSON.parse(originalText);
    } catch (e) {
      // Decrypted but not JSON? Might be a plain string
      return originalText;
    }
  } catch (err) {
    return fallbackParse(ciphertext);
  }
};

/**
 * Fallback to try parsing as plain JSON if decryption fails
 */
const fallbackParse = (data: string): any => {
  try {
    return JSON.parse(data);
  } catch (e) {
    // If it's not JSON, just return the raw data if it's a string, or null
    return data;
  }
};
