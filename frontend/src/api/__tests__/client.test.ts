import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  apiRequest,
  clearRequestCache,
  invalidateCacheByUrl,
  isCancelledError,
  createCancellableRequest,
} from '../client';
import { ApiError } from '../types';

// Since apiClient uses interceptors that are hard to test with mocks,
// we'll focus on testing the exported functions and ApiError class

describe('API Client', () => {
  beforeEach(() => {
    clearRequestCache();
  });

  describe('ApiError', () => {
    it('creates error with all properties', () => {
      const error = new ApiError(
        'Test message',
        'test_code',
        { field: ['Error 1', 'Error 2'] },
        400,
        'req-123'
      );

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('test_code');
      expect(error.details).toEqual({ field: ['Error 1', 'Error 2'] });
      expect(error.status).toBe(400);
      expect(error.requestId).toBe('req-123');
      expect(error.name).toBe('ApiError');
    });

    it('extends Error properly', () => {
      const error = new ApiError('Test', 'code');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });

    describe('isValidationError', () => {
      it('returns true for validation errors with details', () => {
        const error = new ApiError(
          'Validation failed',
          'validation_error',
          { email: ['Invalid'] },
          400
        );
        expect(error.isValidationError()).toBe(true);
      });

      it('returns false for validation_error without details', () => {
        const error = new ApiError('Validation failed', 'validation_error', undefined, 400);
        expect(error.isValidationError()).toBe(false);
      });

      it('returns false for other error codes', () => {
        const error = new ApiError('Not found', 'not_found', undefined, 404);
        expect(error.isValidationError()).toBe(false);
      });

      it('returns false for other codes even with details', () => {
        const error = new ApiError(
          'Auth error',
          'authentication_failed',
          { email: ['Error'] },
          401
        );
        expect(error.isValidationError()).toBe(false);
      });
    });

    describe('getFieldError', () => {
      it('returns field errors array', () => {
        const error = new ApiError(
          'Validation failed',
          'validation_error',
          { email: ['Required', 'Invalid format'], name: ['Too short'] },
          400
        );

        expect(error.getFieldError('email')).toEqual(['Required', 'Invalid format']);
        expect(error.getFieldError('name')).toEqual(['Too short']);
      });

      it('returns undefined for non-existent field', () => {
        const error = new ApiError(
          'Validation failed',
          'validation_error',
          { email: ['Required'] },
          400
        );

        expect(error.getFieldError('password')).toBeUndefined();
      });

      it('returns undefined when no details', () => {
        const error = new ApiError('Error', 'error');
        expect(error.getFieldError('email')).toBeUndefined();
      });
    });

    describe('getFirstFieldError', () => {
      it('returns first error for field', () => {
        const error = new ApiError(
          'Validation failed',
          'validation_error',
          { email: ['Required', 'Invalid format', 'Too long'] },
          400
        );

        expect(error.getFirstFieldError('email')).toBe('Required');
      });

      it('returns undefined for non-existent field', () => {
        const error = new ApiError(
          'Validation failed',
          'validation_error',
          { email: ['Required'] },
          400
        );

        expect(error.getFirstFieldError('password')).toBeUndefined();
      });

      it('returns undefined when no details', () => {
        const error = new ApiError('Error', 'error');
        expect(error.getFirstFieldError('email')).toBeUndefined();
      });

      it('returns undefined for empty error array', () => {
        const error = new ApiError(
          'Validation failed',
          'validation_error',
          { email: [] },
          400
        );

        expect(error.getFirstFieldError('email')).toBeUndefined();
      });
    });
  });

  describe('cache management', () => {
    it('clearRequestCache clears the cache', () => {
      // This just verifies the function runs without error
      expect(() => clearRequestCache()).not.toThrow();
    });

    it('invalidateCacheByUrl runs without error', () => {
      expect(() => invalidateCacheByUrl('/users/')).not.toThrow();
    });
  });

  describe('cancellation utilities', () => {
    describe('createCancellableRequest', () => {
      it('returns signal and cancel function', () => {
        const { signal, cancel } = createCancellableRequest();

        expect(signal).toBeInstanceOf(AbortSignal);
        expect(typeof cancel).toBe('function');
      });

      it('signal is not aborted initially', () => {
        const { signal } = createCancellableRequest();
        expect(signal.aborted).toBe(false);
      });

      it('cancel aborts the signal', () => {
        const { signal, cancel } = createCancellableRequest();

        cancel();

        expect(signal.aborted).toBe(true);
      });
    });

    describe('isCancelledError', () => {
      it('returns true for axios cancel error', () => {
        const cancelError = new axios.Cancel('Operation cancelled');
        expect(isCancelledError(cancelError)).toBe(true);
      });

      it('returns false for regular Error', () => {
        const error = new Error('Regular error');
        expect(isCancelledError(error)).toBe(false);
      });

      it('returns false for ApiError', () => {
        const error = new ApiError('API error', 'error_code');
        expect(isCancelledError(error)).toBe(false);
      });

      it('returns false for null/undefined', () => {
        expect(isCancelledError(null)).toBe(false);
        expect(isCancelledError(undefined)).toBe(false);
      });

      it('returns false for plain object', () => {
        expect(isCancelledError({ message: 'error' })).toBe(false);
      });
    });
  });

  describe('error handling patterns', () => {
    it('ApiError can be caught and inspected', async () => {
      const error = new ApiError(
        'Email already exists',
        'validation_error',
        { email: ['This email is already registered'] },
        400
      );

      try {
        throw error;
      } catch (e) {
        if (e instanceof ApiError) {
          expect(e.isValidationError()).toBe(true);
          expect(e.getFirstFieldError('email')).toBe('This email is already registered');
          expect(e.status).toBe(400);
        } else {
          throw new Error('Expected ApiError');
        }
      }
    });

    it('ApiError works with try/catch pattern', () => {
      function throwApiError() {
        throw new ApiError('Not found', 'not_found', undefined, 404);
      }

      expect(throwApiError).toThrow(ApiError);
      expect(throwApiError).toThrow('Not found');
    });

    it('ApiError instanceof works correctly', () => {
      const error = new ApiError('Test', 'test');

      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof TypeError).toBe(false);
    });
  });

  describe('ApiError serialization', () => {
    it('has correct name property', () => {
      const error = new ApiError('Test', 'test');
      expect(error.name).toBe('ApiError');
    });

    it('stack trace is available', () => {
      const error = new ApiError('Test', 'test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });

    it('toString includes message', () => {
      const error = new ApiError('Test message', 'test_code');
      expect(error.toString()).toContain('Test message');
    });
  });

  describe('ApiError edge cases', () => {
    it('handles empty message', () => {
      const error = new ApiError('', 'empty');
      expect(error.message).toBe('');
    });

    it('handles undefined optional parameters', () => {
      const error = new ApiError('Message');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.status).toBeUndefined();
      expect(error.requestId).toBeUndefined();
    });

    it('handles special characters in message', () => {
      const error = new ApiError('Error: "invalid" <script>alert(1)</script>', 'xss_test');
      expect(error.message).toBe('Error: "invalid" <script>alert(1)</script>');
    });

    it('handles nested details structure', () => {
      const error = new ApiError(
        'Complex validation',
        'validation_error',
        {
          'user.email': ['Invalid'],
          'user.profile.bio': ['Too long'],
        },
        400
      );

      expect(error.getFieldError('user.email')).toEqual(['Invalid']);
      expect(error.getFieldError('user.profile.bio')).toEqual(['Too long']);
    });
  });
});
