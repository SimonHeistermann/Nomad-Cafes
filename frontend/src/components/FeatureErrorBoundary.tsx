/**
 * Feature-level error boundary with customizable fallback UI.
 *
 * Use this to wrap feature sections (pages, major components) to prevent
 * errors in one feature from crashing the entire app.
 *
 * Usage:
 * ```tsx
 * <FeatureErrorBoundary feature="explore">
 *   <ExplorePage />
 * </FeatureErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  /** Feature name for error context (e.g., 'explore', 'account') */
  feature: string;
  /** Optional custom fallback component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, feature: string) => void;
  /** Whether to show navigation options (default: true) */
  showNavigation?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Wrapper to access hooks in class component
function FeatureErrorFallback({
  error,
  feature,
  onRetry,
  showNavigation = true,
}: {
  error: Error | null;
  feature: string;
  onRetry: () => void;
  showNavigation?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        margin: '1rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>
        {t('errors.feature.title', { feature: t(`featureNames.${feature}`, feature) })}
      </h2>

      <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px' }}>
        {error?.message || t('errors.feature.defaultMessage')}
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'white',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          {t('errors.feature.tryAgain')}
        </button>

        {showNavigation && (
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            {t('errors.feature.goHome')}
          </button>
        )}
      </div>
    </div>
  );
}

class FeatureErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[${this.props.feature}] Error:`, error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, this.props.feature);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <FeatureErrorFallback
          error={this.state.error}
          feature={this.props.feature}
          onRetry={this.handleRetry}
          showNavigation={this.props.showNavigation}
        />
      );
    }

    return this.props.children;
  }
}

export const FeatureErrorBoundary = FeatureErrorBoundaryClass;
export default FeatureErrorBoundary;
