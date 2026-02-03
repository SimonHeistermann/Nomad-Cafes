import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseApiError,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isServerError,
  getServerErrorMessage,
} from '../errorHandler';
import i18n from '@/lib/i18n/config';

describe('errorHandler', () => {
  beforeEach(() => {
    // Ensure i18n is initialized
    i18n.changeLanguage('en');
  });

  describe('parseApiError', () => {
    it('extracts data from Axios error with response', () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            code: 'validation_error',
            message: 'Invalid input',
            detail: 'Email is required',
          },
        },
      };

      const result = parseApiError(axiosError);

      expect(result.status).toBe(400);
      expect(result.code).toBe('validation_error');
      expect(result.message).toBe('Email is required'); // detail takes precedence
    });

    it('uses message when detail is not present', () => {
      const axiosError = {
        response: {
          status: 401,
          data: {
            code: 'unauthorized',
            message: 'Not authenticated',
          },
        },
      };

      const result = parseApiError(axiosError);
      expect(result.message).toBe('Not authenticated');
    });

    it('extracts from plain error object', () => {
      const plainError = {
        code: 'not_found',
        message: 'Resource not found',
        detail: 'User does not exist',
      };

      const result = parseApiError(plainError);

      expect(result.code).toBe('not_found');
      expect(result.message).toBe('User does not exist');
    });

    it('extracts from Error instance', () => {
      const error = new Error('Something went wrong');

      const result = parseApiError(error);

      expect(result.message).toBe('Something went wrong');
    });

    it('returns empty object for unknown error types', () => {
      expect(parseApiError(null)).toEqual({});
      expect(parseApiError(undefined)).toEqual({});
      expect(parseApiError('string error')).toEqual({});
      expect(parseApiError(123)).toEqual({});
    });
  });

  describe('getErrorMessage', () => {
    it('returns translated message for known error codes', () => {
      const error = {
        response: {
          data: {
            code: 'invalid_credentials',
          },
        },
      };

      const message = getErrorMessage(error);

      // Should return the translated message
      expect(message).toBeTruthy();
      expect(message).not.toBe('invalid_credentials');
    });

    it('returns translated message for HTTP status codes', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      };

      const message = getErrorMessage(error);

      expect(message).toBeTruthy();
      expect(message).not.toBe('404');
    });

    it('returns generic error message as fallback', () => {
      const error = {
        response: {
          status: 999, // Unknown status
          data: { code: 'unknown_code' },
        },
      };

      const message = getErrorMessage(error);

      // Should fall back to generic error
      expect(message).toBeTruthy();
    });

    it('handles token_expired error code', () => {
      const error = {
        response: {
          status: 401,
          data: { code: 'token_expired' },
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('handles validation_error code', () => {
      const error = {
        response: {
          status: 400,
          data: { code: 'validation_error' },
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('handles throttled error code', () => {
      const error = {
        response: {
          status: 429,
          data: { code: 'throttled' },
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBeTruthy();
    });
  });

  describe('isNetworkError', () => {
    it('returns true for network errors', () => {
      const networkError = { code: 'ERR_NETWORK' };
      expect(isNetworkError(networkError)).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isNetworkError({ code: 'OTHER_ERROR' })).toBe(false);
      expect(isNetworkError(new Error('test'))).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('returns true for 401 status', () => {
      const error = {
        response: {
          status: 401,
          data: {},
        },
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns true for not_authenticated code', () => {
      const error = {
        response: {
          data: { code: 'not_authenticated' },
        },
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns true for token_expired code', () => {
      const error = {
        response: {
          data: { code: 'token_expired' },
        },
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = {
        response: {
          status: 400,
          data: { code: 'validation_error' },
        },
      };
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('returns true for 5xx status codes', () => {
      expect(isServerError({ response: { status: 500 } })).toBe(true);
      expect(isServerError({ response: { status: 502 } })).toBe(true);
      expect(isServerError({ response: { status: 503 } })).toBe(true);
      expect(isServerError({ response: { status: 504 } })).toBe(true);
    });

    it('returns true for network errors', () => {
      const networkError = { code: 'ERR_NETWORK' };
      expect(isServerError(networkError)).toBe(true);
    });

    it('returns false for 4xx errors', () => {
      expect(isServerError({ response: { status: 400 } })).toBe(false);
      expect(isServerError({ response: { status: 401 } })).toBe(false);
      expect(isServerError({ response: { status: 404 } })).toBe(false);
    });

    it('returns false for unknown errors', () => {
      expect(isServerError(new Error('test'))).toBe(false);
      expect(isServerError(null)).toBe(false);
    });
  });

  describe('getServerErrorMessage', () => {
    it('returns network error message for network errors', () => {
      const networkError = { code: 'ERR_NETWORK' };
      const message = getServerErrorMessage(networkError);
      expect(message).toBeTruthy();
    });

    it('returns translated message for 500 error', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };
      const message = getServerErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('returns translated message for 502 error', () => {
      const error = {
        response: {
          status: 502,
          data: {},
        },
      };
      const message = getServerErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('returns translated message for 503 error', () => {
      const error = {
        response: {
          status: 503,
          data: {},
        },
      };
      const message = getServerErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('returns translated message for 504 error', () => {
      const error = {
        response: {
          status: 504,
          data: {},
        },
      };
      const message = getServerErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('returns generic server error for unknown status', () => {
      const error = {
        response: {
          status: 599,
          data: {},
        },
      };
      const message = getServerErrorMessage(error);
      expect(message).toBeTruthy();
    });
  });

  describe('error code mappings', () => {
    const testCases = [
      { code: 'user_not_found', description: 'user not found' },
      { code: 'invalid_credentials', description: 'invalid credentials' },
      { code: 'authentication_failed', description: 'auth failed' },
      { code: 'token_expired', description: 'token expired' },
      { code: 'token_invalid', description: 'token invalid' },
      { code: 'token_not_valid', description: 'token not valid' },
      { code: 'email_not_verified', description: 'email not verified' },
      { code: 'account_disabled', description: 'account disabled' },
      { code: 'permission_denied', description: 'permission denied' },
      { code: 'not_authenticated', description: 'not authenticated' },
      { code: 'not_found', description: 'not found' },
      { code: 'already_exists', description: 'already exists' },
      { code: 'server_error', description: 'server error' },
      { code: 'service_unavailable', description: 'service unavailable' },
    ];

    testCases.forEach(({ code, description }) => {
      it(`handles ${description} (${code})`, () => {
        const error = {
          response: {
            data: { code },
          },
        };

        const message = getErrorMessage(error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      });
    });
  });

  describe('HTTP status code mappings', () => {
    const statusCodes = [400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504];

    statusCodes.forEach((status) => {
      it(`handles ${status} status code`, () => {
        const error = {
          response: {
            status,
            data: {},
          },
        };

        const message = getErrorMessage(error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      });
    });
  });
});
