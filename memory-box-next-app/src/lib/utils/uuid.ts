/**
 * UUID Generation Utility
 *
 * Provides a consistent way to generate UUIDs across all browsers,
 * with a polyfill for browsers that don't support crypto.randomUUID()
 */

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID() if available, otherwise falls back to a polyfill
 */
export function generateUUID(): string {
  // Use native implementation if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Polyfill for browsers without crypto.randomUUID()
  // This is needed for some Android WebView implementations
  return polyfillUUID();
}

/**
 * Polyfill implementation of UUID v4 generation
 * Uses crypto.getRandomValues() which has wider browser support
 */
function polyfillUUID(): string {
  // Check if we have crypto.getRandomValues (required for secure random numbers)
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('crypto.getRandomValues() is not available');
  }

  // Generate random bytes
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version (4) and variant bits according to RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to UUID string format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex: string[] = [];
  bytes.forEach(b => {
    hex.push(b.toString(16).padStart(2, '0'));
  });

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join('')
  ].join('-');
}
