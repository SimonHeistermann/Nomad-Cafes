import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/contexts';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { isCancelledError } from '@/api/client';

/**
 * Options for the useApiCall hook
 */
export interface UseApiCallOptions {
  /**
   * Whether to show toast notifications for server errors (5xx)
   * @default true
   */
  showServerErrorToast?: boolean;

  /**
   * Whether to show toast notifications for user errors (4xx)
   * @default false
   */
  showUserErrorToast?: boolean;

  /**
   * Custom success message to show as toast
   */
  successMessage?: string;

  /**
   * Callback when the call succeeds
   */
  onSuccess?: () => void;

  /**
   * Callback when the call fails
   */
  onError?: (error: unknown) => void;
}

/**
 * Return type for the useApiCall hook
 */
export interface UseApiCallResult<T, Args extends unknown[] = unknown[]> {
  /**
   * The data returned from the API call
   */
  data: T | null;

  /**
   * Whether the API call is in progress
   */
  isLoading: boolean;

  /**
   * Error message for user-facing display (4xx errors)
   */
  error: string | null;

  /**
   * Execute the API call
   */
  execute: (...args: Args) => Promise<T | null>;

  /**
   * Reset the state (clear data and error)
   */
  reset: () => void;

  /**
   * Retry the last failed request
   */
  retry: () => Promise<T | null>;

  /**
   * Cancel the current in-flight request
   */
  cancel: () => void;
}

/**
 * Hook for making API calls with consistent error handling and toast notifications.
 *
 * Server errors (5xx, network) are shown as toast notifications.
 * User errors (4xx) are returned as the `error` state for inline display.
 *
 * Features:
 * - Automatic cancellation on unmount (prevents memory leaks)
 * - Retry support for failed requests
 * - Manual cancellation via cancel()
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute, retry } = useApiCall(
 *   (id: string) => cafesApi.getCafe(id),
 *   { successMessage: 'Cafe loaded!' }
 * );
 *
 * // Execute the call
 * await execute('cafe-123');
 *
 * // Handle states
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage onRetry={retry}>{error}</ErrorMessage>;
 * if (data) return <CafeCard cafe={data} />;
 * ```
 */
export function useApiCall<T, Args extends unknown[] = unknown[]>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseApiCallOptions = {},
): UseApiCallResult<T, Args> {
  const {
    showServerErrorToast = true,
    showUserErrorToast = false,
    successMessage,
    onSuccess,
    onError,
  } = options;

  const { showError, showSuccess } = useToast();

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track the current AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store the last args for retry functionality
  const lastArgsRef = useRef<Args | null>(null);

  // Use ref to avoid recreating execute when options change
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Cleanup on unmount - cancel any pending requests
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any in-flight request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Store args for retry
      lastArgsRef.current = args;

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);

        // Check if this request was cancelled or component unmounted
        if (controller.signal.aborted || !isMountedRef.current) {
          return null;
        }

        setData(result);
        setIsLoading(false);

        if (successMessage) {
          showSuccess(successMessage);
        }

        onSuccess?.();
        return result;
      } catch (err: unknown) {
        // Ignore cancelled requests
        if (isCancelledError(err)) {
          return null;
        }

        // Check if component is still mounted
        if (!isMountedRef.current) {
          return null;
        }

        setIsLoading(false);

        // Server errors (5xx, network) → Toast notification
        if (isServerError(err)) {
          if (showServerErrorToast) {
            showError(getServerErrorMessage(err));
          }
        } else {
          // User errors (4xx) → inline error or toast based on config
          const errorMessage = getErrorMessage(err);
          if (showUserErrorToast) {
            showError(errorMessage);
          } else {
            setError(errorMessage);
          }
        }

        onError?.(err);
        return null;
      } finally {
        // Clean up the controller reference if this is the current one
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [apiFunction, showError, showSuccess, successMessage, showServerErrorToast, showUserErrorToast, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    lastArgsRef.current = null;
  }, []);

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastArgsRef.current) {
      return execute(...lastArgsRef.current);
    }
    return null;
  }, [execute]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    retry,
    cancel,
  };
}

/**
 * Hook for making mutation API calls (POST, PUT, PATCH, DELETE) with consistent error handling.
 *
 * This is a convenience wrapper around useApiCall with sensible defaults for mutations:
 * - Shows success toast by default
 * - Shows server error toasts
 * - Returns error for inline display
 *
 * @example
 * ```tsx
 * const { isLoading, error, execute, retry } = useApiMutation(
 *   (data: ReviewCreateRequest) => reviewsApi.createReview('cafe-123', data),
 *   { successMessage: t('review.submitted') }
 * );
 *
 * const handleSubmit = async (data: ReviewCreateRequest) => {
 *   const result = await execute(data);
 *   if (result) {
 *     // Success - reset form, etc.
 *   }
 * };
 * ```
 */
export function useApiMutation<T, Args extends unknown[] = unknown[]>(
  apiFunction: (...args: Args) => Promise<T>,
  options: UseApiCallOptions = {},
): UseApiCallResult<T, Args> {
  return useApiCall<T, Args>(apiFunction, {
    showServerErrorToast: true,
    showUserErrorToast: false,
    ...options,
  });
}

export default useApiCall;
