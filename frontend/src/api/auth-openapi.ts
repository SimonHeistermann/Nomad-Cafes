/**
 * Auth API using type-safe OpenAPI client
 *
 * Uses openapi-fetch with auto-generated types and camelCase transformation middleware.
 * Provides typed wrappers for auth endpoints where the OpenAPI schema lacks request body types.
 */

import { api } from './openapi-client';
import { setUserData, clearUserData } from './client';
import type { components } from './generated/schema';

// Re-export the generated User type (snake_case from schema, transformed to camelCase by middleware)
type ApiUser = components['schemas']['User'];

// camelCase version (what the middleware transforms to)
export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'owner' | 'admin';
  isEmailVerified: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

/**
 * Type-safe Auth API using openapi-fetch
 *
 * Note: The OpenAPI schema lacks request body types for some auth endpoints.
 * We use typed wrappers to provide full type safety while the middleware handles
 * snake_case ↔ camelCase transformation automatically.
 */
export const authApiOpenApi = {
  /**
   * Login with email and password
   * Tokens are set as httpOnly cookies by the backend
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data, error } = await api.POST('/api/auth/login/', {
      body: credentials as unknown,
    });

    if (error) throw error;

    // The response is transformed to camelCase by middleware
    const user = (data as unknown as { user: User }).user;

    // Store user data locally for UI purposes
    setUserData(user);

    return { user, message: (data as unknown as { message?: string }).message };
  },

  /**
   * Register a new user
   * Tokens are set as httpOnly cookies by the backend
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { data, error } = await api.POST('/api/auth/register/', {
      body: userData as unknown,
    });

    if (error) throw error;

    const user = (data as unknown as { user: User }).user;

    setUserData(user);

    return { user, message: (data as unknown as { message?: string }).message };
  },

  /**
   * Logout current user
   * Clears httpOnly cookies on the backend
   */
  async logout(): Promise<void> {
    try {
      await api.POST('/api/auth/logout/');
    } finally {
      // Clear local user data regardless of API response
      clearUserData();
    }
  },

  /**
   * Refresh access token
   * Uses refresh token from httpOnly cookie
   */
  async refreshToken(): Promise<void> {
    const { error } = await api.POST('/api/auth/token/refresh/');
    if (error) throw error;
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    const { error } = await api.POST('/api/auth/password-reset/', {
      body: data as unknown,
    });
    if (error) throw error;
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    const { error } = await api.POST('/api/auth/password-reset/confirm/', {
      // Middleware transforms camelCase to snake_case automatically
      body: data as unknown,
    });
    if (error) throw error;
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const { error } = await api.POST('/api/auth/verify-email/', {
      body: { token } as unknown,
    });
    if (error) throw error;
  },

  /**
   * Resend email verification
   */
  async resendVerification(email: string): Promise<void> {
    const { error } = await api.POST('/api/auth/resend-verification/', {
      body: { email } as unknown,
    });
    if (error) throw error;
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { error } = await api.POST('/api/auth/change-password/', {
      // Middleware transforms camelCase to snake_case automatically
      body: { currentPassword, newPassword } as unknown,
    });
    if (error) throw error;
  },

  /**
   * Get current user profile
   * This endpoint has proper types in the generated schema
   */
  async getCurrentUser(): Promise<User> {
    const { data, error } = await api.GET('/api/auth/me/');

    if (error) throw error;

    // The middleware transforms snake_case to camelCase
    const user = data as unknown as User;

    // Update local cache
    setUserData(user);

    return user;
  },

  /**
   * Update user profile
   * This endpoint has proper types in the generated schema
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const { data, error } = await api.PATCH('/api/auth/me/', {
      body: profileData as unknown,
    });

    if (error) throw error;

    const user = data as unknown as User;

    // Update local cache
    setUserData(user);

    return user;
  },
};
