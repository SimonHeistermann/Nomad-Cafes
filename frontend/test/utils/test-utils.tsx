import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthCtaProvider } from '@/contexts/AuthCtaContext';
import '@/lib/i18n/config';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AuthCtaProvider>{children}</AuthCtaProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

/**
 * Custom render function that wraps components with all necessary providers
 * Use this instead of @testing-library/react's render for components that need routing, auth, or toasts
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders };
