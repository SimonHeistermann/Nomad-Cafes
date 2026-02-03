/**
 * Sanitization utilities for preventing XSS and HTML injection
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Removes all HTML tags from a string
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Validates that a string doesn't contain potential XSS patterns
 */
export function containsXssPatterns(text: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=, onerror=
    /<embed[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(text));
}

/**
 * Sanitizes user input by removing HTML tags and escaping special characters
 */
export function sanitizeInput(text: string): string {
  // First strip HTML tags
  let sanitized = stripHtmlTags(text);

  // Then escape remaining special characters
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (allows international formats)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-numeric characters except + for country code
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Must have at least 7 digits (excluding +)
  const digitCount = cleaned.replace(/\+/g, '').length;

  return digitCount >= 7 && digitCount <= 15;
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes text for safe display (more lenient than sanitizeInput)
 * Allows line breaks but removes dangerous HTML
 */
export function sanitizeForDisplay(text: string): string {
  // Remove script tags and event handlers
  let sanitized = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}
