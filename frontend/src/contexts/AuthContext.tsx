import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, isAuthenticated as checkAuth, setUserData, clearUserData } from '@/api';
import { ApiError } from '@/api/types';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/api/types';
import { setUserContext, clearUserContext } from '@/lib/sentry';

// Storage key for cross-tab communication
const AUTH_LOGOUT_EVENT_KEY = 'auth_logout_event';
const AUTH_LOGIN_EVENT_KEY = 'auth_login_event';

// Interval for periodic auth check (5 minutes)
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to track if we initiated the logout (to avoid double handling)
  const isLoggingOut = useRef(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const hasToken = checkAuth();

        if (hasToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Set Sentry user context on initial load
          setUserContext(parsedUser.id);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid data
        clearUserData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Cross-tab logout sync via storage events
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Handle logout event from another tab
      if (event.key === AUTH_LOGOUT_EVENT_KEY && event.newValue) {
        // Another tab logged out - clear our state too
        setUser(null);
        clearUserData();
      }

      // Handle login event from another tab
      if (event.key === AUTH_LOGIN_EVENT_KEY && event.newValue) {
        try {
          const userData = JSON.parse(event.newValue);
          setUser(userData);
        } catch {
          // Invalid JSON, ignore
        }
      }

      // Handle user data change
      if (event.key === 'user') {
        if (event.newValue === null) {
          // User was cleared in another tab
          setUser(null);
        } else if (event.newValue) {
          try {
            const userData = JSON.parse(event.newValue);
            setUser(userData);
          } catch {
            // Invalid JSON, ignore
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Periodic auth check to sync state with server
  useEffect(() => {
    // Don't run periodic check if not authenticated
    if (!user) return;

    const checkAuthState = async () => {
      // Check if we still have valid auth
      if (!checkAuth()) {
        // Auth expired - clear local state
        setUser(null);
        clearUserData();
        return;
      }

      // Optionally verify with server (lightweight check)
      // This catches cases where the server invalidated the session
      try {
        await api.auth.getCurrentUser();
        // Still authenticated - state is already correct
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // Server says we're not authenticated - clear local state
          setUser(null);
          clearUserData();
        }
        // Other errors (network, etc.) - don't clear state, might be temporary
      }
    };

    // Run immediately on mount, then periodically
    const intervalId = setInterval(checkAuthState, AUTH_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await api.auth.login(credentials);
      setUser(response.user);
      setUserData(response.user);

      // Set Sentry user context for error tracking
      setUserContext(response.user.id);

      // Notify other tabs of login
      localStorage.setItem(AUTH_LOGIN_EVENT_KEY, JSON.stringify(response.user));
      // Clean up the event key (the storage event is fired on setItem)
      localStorage.removeItem(AUTH_LOGIN_EVENT_KEY);
    } catch (error) {
      // Log error for debugging/monitoring
      if (error instanceof ApiError) {
        console.error(`Login failed [${error.code}]:`, error.message);
      } else {
        console.error('Login failed:', error);
      }
      // Re-throw so the form can handle it and show appropriate UI
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await api.auth.register(data);
      setUser(response.user);
      setUserData(response.user);

      // Set Sentry user context for error tracking
      setUserContext(response.user.id);

      // Notify other tabs of login
      localStorage.setItem(AUTH_LOGIN_EVENT_KEY, JSON.stringify(response.user));
      localStorage.removeItem(AUTH_LOGIN_EVENT_KEY);
    } catch (error) {
      // Log error for debugging/monitoring
      if (error instanceof ApiError) {
        console.error(`Registration failed [${error.code}]:`, error.message);
        // Log validation errors for debugging
        if (error.details) {
          console.error('Validation details:', error.details);
        }
      } else {
        console.error('Registration failed:', error);
      }
      // Re-throw so the form can handle it and show appropriate UI
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Prevent double logout
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    setIsLoading(true);
    try {
      await api.auth.logout();
    } catch (error) {
      // Log error but don't re-throw - we still want to clear local state
      // even if the server-side logout fails (network error, etc.)
      if (error instanceof ApiError) {
        console.error(`Logout API call failed [${error.code}]:`, error.message);
      } else {
        console.error('Logout API call failed:', error);
      }
      // Continue with local logout regardless of API error
    } finally {
      // Always clear local state, even if API call failed
      setUser(null);
      clearUserData();

      // Clear Sentry user context
      clearUserContext();

      // Notify other tabs of logout
      // Using timestamp to ensure storage event fires even if value is same
      localStorage.setItem(AUTH_LOGOUT_EVENT_KEY, Date.now().toString());
      localStorage.removeItem(AUTH_LOGOUT_EVENT_KEY);

      setIsLoading(false);
      isLoggingOut.current = false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!checkAuth()) {
      setUser(null);
      return;
    }

    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
      setUserData(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      clearUserData();
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && checkAuth(),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
