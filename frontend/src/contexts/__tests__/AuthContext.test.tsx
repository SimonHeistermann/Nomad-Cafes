import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { api } from '@/api';
import { ApiError } from '@/api/types';

// Mock the API module
vi.mock('@/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  },
  isAuthenticated: vi.fn(() => false),
  setUserData: vi.fn(),
  clearUserData: vi.fn(),
}));

// Test component that uses the auth context
function TestComponent({ onReady }: { onReady?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();

  if (onReady) {
    onReady(auth);
  }

  return (
    <div>
      <span data-testid="loading">{auth.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{auth.isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{auth.user?.name || 'none'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  };

  const originalError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('useAuth outside provider', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress the error boundary warning
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      spy.mockRestore();
    });
  });

  describe('login', () => {
    it('handles successful login', async () => {
      const mockResponse = { user: mockUser };
      (api.auth.login as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await act(async () => {
        await authContext!.login({ email: 'test@example.com', password: 'password' });
      });

      expect(api.auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('handles login failure with ApiError', async () => {
      const apiError = new ApiError('Invalid credentials', 'invalid_credentials', undefined, 401);
      (api.auth.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(apiError);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await expect(
        act(async () => {
          await authContext!.login({ email: 'test@example.com', password: 'wrong' });
        })
      ).rejects.toThrow('Invalid credentials');

      // Error should be logged
      expect(console.error).toHaveBeenCalled();
      const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.some((c: unknown[]) =>
        typeof c[0] === 'string' && c[0].includes('Login failed')
      )).toBe(true);
    });

    it('handles login failure with generic error', async () => {
      const error = new Error('Network error');
      (api.auth.login as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await expect(
        act(async () => {
          await authContext!.login({ email: 'test@example.com', password: 'pass' });
        })
      ).rejects.toThrow('Network error');

      expect(console.error).toHaveBeenCalledWith('Login failed:', error);
    });

    it('sets isLoading during login', async () => {
      let resolveLogin: (value: unknown) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      (api.auth.login as ReturnType<typeof vi.fn>).mockReturnValueOnce(loginPromise);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      // Start login
      act(() => {
        authContext!.login({ email: 'test@example.com', password: 'pass' }).catch(() => {});
      });

      // Should be loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loading');
      });

      // Resolve login
      await act(async () => {
        resolveLogin!({ user: mockUser });
      });

      // Should be done loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });
  });

  describe('register', () => {
    it('handles successful registration', async () => {
      const mockResponse = { user: mockUser };
      (api.auth.register as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await act(async () => {
        await authContext!.register({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });
      });

      expect(api.auth.register).toHaveBeenCalled();
    });

    it('handles registration failure with validation errors', async () => {
      const apiError = new ApiError(
        'Validation failed',
        'validation_error',
        { email: ['Email already exists'] },
        400
      );
      (api.auth.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce(apiError);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await expect(
        act(async () => {
          await authContext!.register({
            name: 'User',
            email: 'existing@example.com',
            password: 'pass',
          });
        })
      ).rejects.toThrow('Validation failed');

      // Validation details should be logged
      expect(console.error).toHaveBeenCalledWith(
        'Validation details:',
        { email: ['Email already exists'] }
      );
    });

    it('handles registration failure with generic error', async () => {
      const error = new Error('Server error');
      (api.auth.register as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await expect(
        act(async () => {
          await authContext!.register({
            name: 'User',
            email: 'test@example.com',
            password: 'pass',
          });
        })
      ).rejects.toThrow('Server error');

      expect(console.error).toHaveBeenCalledWith('Registration failed:', error);
    });
  });

  describe('logout', () => {
    it('handles successful logout', async () => {
      (api.auth.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await act(async () => {
        await authContext!.logout();
      });

      expect(api.auth.logout).toHaveBeenCalled();
    });

    it('clears local state even when API logout fails', async () => {
      const apiError = new ApiError('Network error', 'network_error', undefined, 500);
      (api.auth.logout as ReturnType<typeof vi.fn>).mockRejectedValueOnce(apiError);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      // Logout should NOT throw even if API fails
      await act(async () => {
        await authContext!.logout();
      });

      // Error should be logged but not thrown
      expect(console.error).toHaveBeenCalled();
      const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.some((c: unknown[]) =>
        typeof c[0] === 'string' && c[0].includes('Logout API call failed')
      )).toBe(true);
    });

    it('clears local state when logout fails with generic error', async () => {
      const error = new Error('Connection lost');
      (api.auth.logout as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      // Should not throw
      await act(async () => {
        await authContext!.logout();
      });

      expect(console.error).toHaveBeenCalledWith('Logout API call failed:', error);
    });
  });

  describe('refreshUser', () => {
    it('handles refresh failure gracefully', async () => {
      const { isAuthenticated } = await import('@/api');
      (isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (api.auth.getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Session expired')
      );

      let authContext: ReturnType<typeof useAuth>;
      render(
        <AuthProvider>
          <TestComponent onReady={(auth) => { authContext = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await act(async () => {
        await authContext!.refreshUser();
      });

      // Should log error but not throw
      expect(console.error).toHaveBeenCalledWith(
        'Failed to refresh user:',
        expect.any(Error)
      );
    });
  });
});
