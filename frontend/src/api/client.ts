import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './types';
import { captureError, addBreadcrumb } from '../lib/sentry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Request deduplication and caching - configurable via environment
const CACHE_TTL_MS = Number(import.meta.env.VITE_API_CACHE_TTL_MS) || 5000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface PendingRequest {
  promise: Promise<AxiosResponse>;
  controller: AbortController;
}

// Simple in-memory cache for GET requests
const requestCache = new Map<string, CacheEntry<AxiosResponse>>();
// Track in-flight requests to deduplicate
const pendingRequests = new Map<string, PendingRequest>();
// Track active requests for cancellation on unmount
const activeControllers = new Map<string, AbortController>();

/**
 * Generate a cache key from request config
 */
function getCacheKey(config: InternalAxiosRequestConfig): string {
  return `${config.method || 'GET'}:${config.url}:${JSON.stringify(config.params || {})}`;
}

/**
 * Generate a unique request ID for tracking
 */
let requestIdCounter = 0;
function generateRequestId(): string {
  return `req_${++requestIdCounter}_${Date.now()}`;
}

/**
 * Clean expired cache entries
 */
function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      requestCache.delete(key);
    }
  }
}

// Clean cache periodically
setInterval(cleanCache, CACHE_TTL_MS);

// Create axios instance with default config
// withCredentials: true is required for httpOnly cookie authentication
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Required for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Deduplication and caching
apiClient.interceptors.request.use(
  (config) => {
    // Generate unique request ID for tracking
    const requestId = generateRequestId();
    (config as InternalAxiosRequestConfig & { _requestId?: string })._requestId = requestId;

    // Only deduplicate/cache GET requests
    if (config.method?.toLowerCase() !== 'get') {
      // For non-GET requests, still add an AbortController if not present
      if (!config.signal) {
        const controller = new AbortController();
        config.signal = controller.signal;
        activeControllers.set(requestId, controller);
      }
      return config;
    }

    const cacheKey = getCacheKey(config);

    // Check cache first
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // Return cached response by throwing a special error that we catch
      const cachedError = new Error('CACHE_HIT') as Error & { cachedResponse: AxiosResponse };
      cachedError.cachedResponse = cached.data;
      throw cachedError;
    }

    // Check if there's already a pending request for this URL
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      // Return the pending request's promise by throwing a special error
      const pendingError = new Error('PENDING_REQUEST') as Error & { pendingPromise: Promise<AxiosResponse> };
      pendingError.pendingPromise = pending.promise;
      throw pendingError;
    }

    // Create an abort controller for this request
    const controller = new AbortController();
    config.signal = controller.signal;
    activeControllers.set(requestId, controller);

    // Create a deferred promise that will be resolved when the request completes
    let resolvePromise: (value: AxiosResponse) => void;
    let rejectPromise: (reason: unknown) => void;
    const promise = new Promise<AxiosResponse>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Store the pending request
    pendingRequests.set(cacheKey, {
      promise,
      controller,
    });

    // Attach the resolve/reject functions to the config for later use
    (config as InternalAxiosRequestConfig & {
      _pendingResolve?: (value: AxiosResponse) => void;
      _pendingReject?: (reason: unknown) => void;
      _cacheKey?: string;
    })._pendingResolve = resolvePromise!;
    (config as InternalAxiosRequestConfig & { _pendingReject?: (reason: unknown) => void })._pendingReject = rejectPromise!;
    (config as InternalAxiosRequestConfig & { _cacheKey?: string })._cacheKey = cacheKey;

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle errors globally and caching
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig & {
      _pendingResolve?: (value: AxiosResponse) => void;
      _cacheKey?: string;
      _requestId?: string;
    };

    // Clean up active controller
    if (config._requestId) {
      activeControllers.delete(config._requestId);
    }

    // Cache successful GET responses
    if (response.config.method?.toLowerCase() === 'get') {
      const cacheKey = config._cacheKey || getCacheKey(response.config);

      // Cache the response
      requestCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      // Resolve pending promise for deduplication
      if (config._pendingResolve) {
        config._pendingResolve(response);
      }

      // Remove from pending
      pendingRequests.delete(cacheKey);
    }
    return response;
  },
  async (error: AxiosError | Error) => {
    // Handle cache hits (return cached data)
    if ('cachedResponse' in error) {
      return (error as { cachedResponse: AxiosResponse }).cachedResponse;
    }

    // Handle pending request deduplication
    if ('pendingPromise' in error) {
      return (error as { pendingPromise: Promise<AxiosResponse> }).pendingPromise;
    }

    // Type guard for AxiosError
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _pendingReject?: (reason: unknown) => void;
      _cacheKey?: string;
      _requestId?: string;
      _retryCount?: number;
      _auth401Retry?: boolean;
    };

    // Clean up active controller
    if (originalRequest?._requestId) {
      activeControllers.delete(originalRequest._requestId);
    }

    // Reject pending promise and clean up
    if (originalRequest?._cacheKey) {
      if (originalRequest._pendingReject) {
        originalRequest._pendingReject(error);
      }
      pendingRequests.delete(originalRequest._cacheKey);
    }

    // Don't retry cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests with retry
    if (error.response?.status === 429 && originalRequest) {
      const retryCount = originalRequest._retryCount || 0;

      if (retryCount < MAX_RETRIES) {
        originalRequest._retryCount = retryCount + 1;

        // Wait before retrying with exponential backoff
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return apiClient.request(originalRequest);
      }
    }

    // If 401 and not a refresh request, try to refresh the token once
    if (error.response?.status === 401 && originalRequest?.url !== '/auth/token/refresh/') {
      // Prevent infinite retry loops
      const hasRetried = originalRequest?._auth401Retry;
      if (!hasRetried && originalRequest) {
        originalRequest._auth401Retry = true;
        try {
          // Try to refresh the token
          await apiClient.post('/auth/token/refresh/');
          // Retry the original request
          return apiClient.request(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear user data but don't redirect (let React handle it)
          localStorage.removeItem('user');
          return Promise.reject(error);
        }
      } else {
        // Already retried or no original request, just clear data
        localStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Clear the request cache - useful when you know data has changed
 */
export function clearRequestCache(): void {
  requestCache.clear();
}

/**
 * Invalidate cache entries matching a URL pattern
 */
export function invalidateCacheByUrl(urlPattern: string): void {
  for (const key of requestCache.keys()) {
    if (key.includes(urlPattern)) {
      requestCache.delete(key);
    }
  }
}

/**
 * Cancel all active requests - useful for cleanup on navigation or unmount
 */
export function cancelAllRequests(): void {
  for (const [id, controller] of activeControllers.entries()) {
    controller.abort();
    activeControllers.delete(id);
  }
}

/**
 * Create an AbortController for a request and return a cancel function.
 * Use this for requests that should be cancelled on component unmount.
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const { signal, cancel } = createCancellableRequest();
 *   fetchData({ signal });
 *   return () => cancel();
 * }, []);
 * ```
 */
export function createCancellableRequest(): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}

/**
 * Helper function for making requests with proper error handling.
 * Throws ApiError with full error details (code, details, status) from backend.
 *
 * @example
 * try {
 *   const data = await apiRequest<User>({ method: 'GET', url: '/auth/me/' });
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.isValidationError()) {
 *       // Handle field-level errors
 *       const emailError = error.getFirstFieldError('email');
 *     }
 *     // Access error.code, error.status, error.requestId
 *   }
 * }
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig,
): Promise<T> {
  // Add breadcrumb for API request tracking
  addBreadcrumb('api', `${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
    params: config.params,
  });

  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      const message = responseData?.message || error.message || 'An unexpected error occurred';
      const code = responseData?.code;
      const details = responseData?.details;
      const status = error.response?.status;
      const requestId = responseData?.request_id;

      const apiError = new ApiError(message, code, details, status, requestId);

      // Capture server errors (5xx) and unexpected client errors in Sentry
      // Skip 401 (auth) and 400 (validation) as these are expected user errors
      if (status && status >= 500) {
        captureError(apiError, {
          url: config.url,
          method: config.method,
          status,
          code,
          requestId,
        });
      }

      throw apiError;
    }

    // Capture unexpected non-Axios errors
    if (error instanceof Error) {
      captureError(error, {
        url: config.url,
        method: config.method,
        errorType: 'non-axios',
      });
    }

    throw error;
  }
}

/**
 * Check if an error is a cancellation error
 */
export function isCancelledError(error: unknown): boolean {
  return axios.isCancel(error);
}

// Check if user data exists (for initial load)
// Note: Actual auth is handled by httpOnly cookies, this just checks local user cache
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('user');
}

// Store user data locally (for UI purposes only, auth is via cookies)
export function setUserData(user: object): void {
  localStorage.setItem('user', JSON.stringify(user));
}

// Clear user data
export function clearUserData(): void {
  localStorage.removeItem('user');
}

// Get stored user data
export function getUserData(): object | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
