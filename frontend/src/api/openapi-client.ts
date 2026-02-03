/**
 * Type-safe OpenAPI Client
 *
 * Uses openapi-fetch with auto-generated types from the backend schema.
 * Automatically transforms snake_case responses to camelCase.
 *
 * Usage:
 * ```typescript
 * import { api } from '@/api/openapi-client';
 *
 * // Get cafes - fully typed!
 * const { data, error } = await api.GET('/api/cafes/', {
 *   params: { query: { page: 1, page_size: 10 } }
 * });
 *
 * // Access typed data
 * if (data) {
 *   console.log(data.results[0].name);
 * }
 * ```
 */

import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema';
import { ApiError } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Convert snake_case string to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively transform object keys from snake_case to camelCase
 */
function transformKeys<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeys) as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = transformKeys(value);
    }
    return transformed as T;
  }

  return obj;
}

/**
 * Convert camelCase string to snake_case
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively transform object keys from camelCase to snake_case (for requests)
 */
function transformKeysToSnake<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeysToSnake) as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = transformKeysToSnake(value);
    }
    return transformed as T;
  }

  return obj;
}

/**
 * Middleware to transform response data from snake_case to camelCase
 */
const camelCaseMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.clone().json();
        const transformedData = transformKeys(data);

        // Create a new response with transformed data
        return new Response(JSON.stringify(transformedData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    }
    return response;
  },
};

/**
 * Middleware to transform request body from camelCase to snake_case
 */
const snakeCaseRequestMiddleware: Middleware = {
  async onRequest({ request }) {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.clone().text();
        if (body) {
          const data = JSON.parse(body);
          const transformedData = transformKeysToSnake(data);

          return new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(transformedData),
            credentials: request.credentials,
          });
        }
      } catch {
        // If parsing fails, return original request
      }
    }
    return request;
  },
};

/**
 * Middleware to handle errors and convert to ApiError
 */
const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.clone().json();
          const message = errorData?.message || errorData?.detail || 'An error occurred';
          const code = errorData?.code;
          const details = errorData?.details;
          const requestId = errorData?.request_id;

          throw new ApiError(message, code, details, response.status, requestId);
        } catch (e) {
          if (e instanceof ApiError) throw e;
          // If JSON parsing fails, throw generic error
          throw new ApiError(`HTTP ${response.status}`, undefined, undefined, response.status);
        }
      }
      throw new ApiError(`HTTP ${response.status}`, undefined, undefined, response.status);
    }
    return response;
  },
};

/**
 * Create the typed OpenAPI client
 */
export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: 'include', // Required for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply middleware in order: request transform -> response transform -> error handling
api.use(snakeCaseRequestMiddleware);
api.use(camelCaseMiddleware);
api.use(errorMiddleware);

/**
 * Helper type for extracting response data types (with camelCase)
 */
export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export type CamelCaseKeys<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends object
    ? CamelCaseKeys<T[K]>
    : T[K];
};

// Re-export for convenience
export { transformKeys, transformKeysToSnake };
