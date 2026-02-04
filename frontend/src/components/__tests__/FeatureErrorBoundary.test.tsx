import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { FeatureErrorBoundary } from '../FeatureErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow, message = 'Feature error' }: { shouldThrow: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div data-testid="feature-content">Feature works</div>;
}

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </MemoryRouter>
  );
}

describe('FeatureErrorBoundary', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    renderWithProviders(
      <FeatureErrorBoundary feature="explore">
        <ThrowError shouldThrow={false} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByTestId('feature-content')).toBeInTheDocument();
    expect(screen.getByText('Feature works')).toBeInTheDocument();
  });

  it('renders fallback UI when an error is thrown', () => {
    renderWithProviders(
      <FeatureErrorBoundary feature="explore">
        <ThrowError shouldThrow={true} message="Explore error" />
      </FeatureErrorBoundary>
    );

    // Should show error message
    expect(screen.getByText('Explore error')).toBeInTheDocument();

    // Should show try again button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows navigation button when showNavigation is true (default)', () => {
    renderWithProviders(
      <FeatureErrorBoundary feature="account">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Should show go home button
    expect(screen.getByRole('button', { name: /go home|home/i })).toBeInTheDocument();
  });

  it('hides navigation button when showNavigation is false', () => {
    renderWithProviders(
      <FeatureErrorBoundary feature="account" showNavigation={false}>
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Should only have try again button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(/try again/i);
  });

  it('calls onError callback with error and feature name', () => {
    const onErrorMock = vi.fn();

    renderWithProviders(
      <FeatureErrorBoundary feature="favorites" onError={onErrorMock}>
        <ThrowError shouldThrow={true} message="Favorites failed" />
      </FeatureErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Favorites failed' }),
      'favorites'
    );
  });

  it('renders custom fallback when provided', () => {
    renderWithProviders(
      <FeatureErrorBoundary
        feature="reviews"
        fallback={<div data-testid="custom-error">Custom reviews error</div>}
      >
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.getByText('Custom reviews error')).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', () => {
    let shouldThrow = true;
    function ControlledFeature() {
      if (shouldThrow) {
        throw new Error('Feature error');
      }
      return <div data-testid="feature-ok">Feature recovered</div>;
    }

    const { rerender } = renderWithProviders(
      <FeatureErrorBoundary feature="test" key="test">
        <ControlledFeature />
      </FeatureErrorBoundary>
    );

    // Should be in error state
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    // Fix the error
    shouldThrow = false;

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Force re-render
    rerender(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <FeatureErrorBoundary feature="test" key="test">
            <ControlledFeature />
          </FeatureErrorBoundary>
        </I18nextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('feature-ok')).toBeInTheDocument();
  });

  it('logs error with feature name prefix', () => {
    renderWithProviders(
      <FeatureErrorBoundary feature="dashboard">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
    const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
    const featureErrorCall = calls.find((call: unknown[]) =>
      typeof call[0] === 'string' && call[0].includes('[dashboard]')
    );
    expect(featureErrorCall).toBeDefined();
  });

  it('shows error icon in fallback UI', () => {
    renderWithProviders(
      <FeatureErrorBoundary feature="test">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Check for SVG error icon
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('multiple FeatureErrorBoundaries are isolated', () => {
    renderWithProviders(
      <div>
        <FeatureErrorBoundary feature="feature1">
          <ThrowError shouldThrow={true} message="Feature 1 error" />
        </FeatureErrorBoundary>
        <FeatureErrorBoundary feature="feature2">
          <ThrowError shouldThrow={false} />
        </FeatureErrorBoundary>
      </div>
    );

    // Feature 1 should be in error state
    expect(screen.getByText('Feature 1 error')).toBeInTheDocument();

    // Feature 2 should work normally
    expect(screen.getByTestId('feature-content')).toBeInTheDocument();
  });
});
