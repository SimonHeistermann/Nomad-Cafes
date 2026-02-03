/**
 * Sentry Configuration for Frontend Error Tracking & Performance Monitoring
 *
 * Features:
 * - Automatic error capturing
 * - Performance tracing for page loads and API calls
 * - User context tracking (without PII)
 * - Release tracking for deployment correlation
 *
 * Configuration via environment variables:
 * - VITE_SENTRY_DSN: Sentry DSN (required for Sentry to work)
 * - VITE_SENTRY_ENVIRONMENT: Environment name (default: from VITE_ENV)
 * - VITE_SENTRY_TRACES_SAMPLE_RATE: Performance sampling rate (default: 0.1)
 */

import * as Sentry from '@sentry/react';

// Only initialize if DSN is provided
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.VITE_ENV || 'development';
const TRACES_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1');
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] DSN not configured - error tracking disabled');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `nomad-cafe-frontend@${APP_VERSION}`,

    // Performance Monitoring
    // Capture 10% of transactions by default (configurable)
    tracesSampleRate: TRACES_SAMPLE_RATE,

    // Session Replay - disabled by default (can be expensive)
    // Uncomment if needed:
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace all fetch/XHR requests to our API
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/api\.nomadcafe/,
          /^https:\/\/.*\.nomadcafe/,
        ],
      }),
      // React-specific error boundary integration
      Sentry.replayIntegration({
        // Mask all text in session replay for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Privacy: Don't send PII
    // User identification is done via anonymous ID, not email/name
    sendDefaultPii: false,

    // Filter out noisy errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Ignore network errors that are likely user connectivity issues
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes('network error') ||
          message.includes('failed to fetch') ||
          message.includes('load failed') ||
          message.includes('aborted')
        ) {
          // Only send if it's a persistent issue (multiple occurrences)
          // For now, we'll filter these out to reduce noise
          return null;
        }
      }

      return event;
    },

    // Filter out health check and static asset requests from performance
    beforeSendTransaction(event) {
      // Filter out requests we don't want to trace
      const transaction = event.transaction;
      if (
        transaction?.includes('/health') ||
        transaction?.includes('/ready') ||
        transaction?.includes('.js') ||
        transaction?.includes('.css') ||
        transaction?.includes('.png') ||
        transaction?.includes('.jpg')
      ) {
        return null;
      }
      return event;
    },
  });

  if (import.meta.env.DEV) {
    console.log(`[Sentry] Initialized for ${ENVIRONMENT} environment`);
  }
}

/**
 * Set user context for error tracking (without PII)
 * Call this when user logs in
 */
export function setUserContext(userId: string): void {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    // Don't include email or name for privacy
  });
}

/**
 * Clear user context when user logs out
 */
export function clearUserContext(): void {
  if (!SENTRY_DSN) return;

  Sentry.setUser(null);
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!SENTRY_DSN) {
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/**
 * Start a performance span for custom operations
 */
export function startSpan<T>(
  name: string,
  operation: string,
  callback: () => T
): T {
  if (!SENTRY_DSN) {
    return callback();
  }

  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback
  );
}

// Re-export Sentry's ErrorBoundary for use in components
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export the whole Sentry SDK for advanced usage
export { Sentry };
