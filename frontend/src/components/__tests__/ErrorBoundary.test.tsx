import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="child-content">Normal content</div>;
}

// Wrapper component to control error throwing
function ErrorThrower({ shouldThrow }: { shouldThrow: boolean }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </I18nextProvider>
  );
}

describe('ErrorBoundary', () => {
  // Suppress console.error during error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(<ErrorThrower shouldThrow={false} />);

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders fallback UI when an error is thrown', () => {
    render(<ErrorThrower shouldThrow={true} />);

    // Should show error title from i18n
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Should show the error message
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // Should show try again button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onError callback when an error is caught', () => {
    const onErrorMock = vi.fn();

    render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </I18nextProvider>
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('renders custom fallback when provided', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error UI</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </I18nextProvider>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('resets error state when try again button is clicked', () => {
    // Use a component that can be controlled
    let shouldThrow = true;
    function ControlledThrower() {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="recovered">Recovered content</div>;
    }

    const { rerender } = render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary key="test">
          <ControlledThrower />
        </ErrorBoundary>
      </I18nextProvider>
    );

    // Should be in error state
    expect(screen.getByRole('button')).toBeInTheDocument();

    // Fix the error
    shouldThrow = false;

    // Click try again
    fireEvent.click(screen.getByRole('button'));

    // Force re-render to pick up the fixed state
    rerender(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary key="test">
          <ControlledThrower />
        </ErrorBoundary>
      </I18nextProvider>
    );

    // Should show recovered content
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(<ErrorThrower shouldThrow={true} />);

    expect(console.error).toHaveBeenCalled();
    // Check that it was called with our error
    const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
    const errorCall = calls.find(
      (call: unknown[]) => call[0] === 'ErrorBoundary caught an error:'
    );
    expect(errorCall).toBeDefined();
  });

  it('shows default message when error has no message', () => {
    function ThrowEmptyError() {
      throw new Error('');
    }

    render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <ThrowEmptyError />
        </ErrorBoundary>
      </I18nextProvider>
    );

    // Should show default message from i18n when error message is empty
    // The component falls back to t('errors.boundary.defaultMessage')
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
