/**
 * Global error handling utilities.
 * Maps API error codes to user-friendly messages.
 */

import i18n from '@/lib/i18n/config';

// Error code to translation key mapping
const ERROR_CODE_MAP: Record<string, string> = {
  // Authentication errors
  user_not_found: 'errors.api.sessionExpired', // JWT user no longer exists
  invalid_credentials: 'errors.api.invalidCredentials',
  authentication_failed: 'errors.api.invalidCredentials',
  token_expired: 'errors.api.sessionExpired',
  token_invalid: 'errors.api.sessionExpired',
  token_not_valid: 'errors.api.sessionExpired',
  email_not_verified: 'errors.api.emailNotVerified',
  account_disabled: 'errors.api.accountDisabled',

  // Validation errors
  validation_error: 'errors.api.validationError',
  parse_error: 'errors.api.invalidRequest',

  // Permission errors
  permission_denied: 'errors.api.permissionDenied',
  not_authenticated: 'errors.api.notAuthenticated',

  // Resource errors
  not_found: 'errors.api.notFound',
  already_exists: 'errors.api.alreadyExists',

  // Rate limiting
  throttled: 'errors.api.tooManyRequests',

  // Server errors
  server_error: 'errors.api.serverError',
  service_unavailable: 'errors.api.serviceUnavailable',
};

// HTTP status code to translation key mapping (fallback)
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'errors.api.badRequest',
  401: 'errors.api.invalidCredentials',
  403: 'errors.api.permissionDenied',
  404: 'errors.api.notFound',
  409: 'errors.api.conflict',
  422: 'errors.api.validationError',
  429: 'errors.api.tooManyRequests',
  500: 'errors.api.serverError',
  502: 'errors.api.serviceUnavailable',
  503: 'errors.api.serviceUnavailable',
  504: 'errors.api.timeout',
};

export interface ApiErrorResponse {
  message?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Extract error information from various error response formats
 */
export function parseApiError(error: unknown): { code?: string; message?: string; status?: number } {
  if (error && typeof error === 'object') {
    // Axios error with response
    if ('response' in error && error.response) {
      const response = error.response as { status?: number; data?: ApiErrorResponse };
      const data = response.data;

      return {
        status: response.status,
        code: data?.code,
        message: data?.detail || data?.message,
      };
    }

    // Plain error object
    if ('code' in error || 'message' in error) {
      return {
        code: (error as ApiErrorResponse).code,
        message: (error as ApiErrorResponse).detail || (error as ApiErrorResponse).message,
      };
    }

    // Error instance
    if (error instanceof Error) {
      return { message: error.message };
    }
  }

  return {};
}

/**
 * Get a user-friendly error message from an API error.
 * Uses i18n translations to provide localized messages.
 */
export function getErrorMessage(error: unknown): string {
  const { code, message, status } = parseApiError(error);

  // Try to get translation from error code
  if (code && ERROR_CODE_MAP[code]) {
    const translationKey = ERROR_CODE_MAP[code];
    const translated = i18n.t(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
  }

  // Try to get translation from HTTP status code
  if (status && STATUS_CODE_MAP[status]) {
    const translationKey = STATUS_CODE_MAP[status];
    const translated = i18n.t(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
  }

  // Fallback to generic error message
  return i18n.t('errors.api.generic');
}

/**
 * Check if an error is a network error (no response from server)
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'ERR_NETWORK';
  }
  return false;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const { code, status } = parseApiError(error);
  return status === 401 || code === 'not_authenticated' || code === 'token_expired';
}

/**
 * Check if an error is a server error (5xx) or network error.
 * These errors should typically be shown via Toast rather than inline.
 */
export function isServerError(error: unknown): boolean {
  // Network error (no response from server)
  if (isNetworkError(error)) {
    return true;
  }

  const { status } = parseApiError(error);

  // 5xx server errors
  if (status && status >= 500) {
    return true;
  }

  return false;
}

/**
 * Get the appropriate error message for server errors (for Toast).
 * Returns localized user-friendly message.
 */
export function getServerErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return i18n.t('errors.api.networkError');
  }

  const { status } = parseApiError(error);

  if (status && STATUS_CODE_MAP[status]) {
    const translationKey = STATUS_CODE_MAP[status];
    const translated = i18n.t(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
  }

  return i18n.t('errors.api.serverError');
}
