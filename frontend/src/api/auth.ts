import { apiRequest, setUserData, clearUserData } from './client';
import { transformUser, transformPasswordResetRequest } from './transformers';
import type { ApiUser, User } from './transformers';
import type {
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from './types';

// API response with snake_case user
interface ApiAuthResponse {
  user: ApiUser;
  message?: string;
}

// Frontend response with camelCase user
export interface AuthResponse {
  user: User;
  message?: string;
}

export const authApi = {
  /**
   * Login with email and password
   * Tokens are set as httpOnly cookies by the backend
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const apiData = await apiRequest<ApiAuthResponse>({
      method: 'POST',
      url: '/auth/login/',
      data: credentials,
    });

    // Transform API response (snake_case) to frontend format (camelCase)
    const user = transformUser(apiData.user);

    // Store user data locally for UI purposes
    // (Auth is handled by httpOnly cookies)
    setUserData(user);

    return { user, message: apiData.message };
  },

  /**
   * Register a new user
   * Tokens are set as httpOnly cookies by the backend
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const apiData = await apiRequest<ApiAuthResponse>({
      method: 'POST',
      url: '/auth/register/',
      data: userData,
    });

    // Transform API response (snake_case) to frontend format (camelCase)
    const user = transformUser(apiData.user);

    // Store user data locally for UI purposes
    setUserData(user);

    return { user, message: apiData.message };
  },

  /**
   * Logout current user
   * Clears httpOnly cookies on the backend
   */
  async logout(): Promise<void> {
    try {
      await apiRequest({
        method: 'POST',
        url: '/auth/logout/',
      });
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
    await apiRequest({
      method: 'POST',
      url: '/auth/token/refresh/',
    });
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: '/auth/password-reset/',
      data,
    });
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: '/auth/password-reset/confirm/',
      data: transformPasswordResetRequest(data),
    });
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: '/auth/verify-email/',
      data: { token },
    });
  },

  /**
   * Resend email verification
   */
  async resendVerification(email: string): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: '/auth/resend-verification/',
      data: { email },
    });
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: '/auth/change-password/',
      data: {
        current_password: currentPassword,
        new_password: newPassword,
      },
    });
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const apiUser = await apiRequest<ApiUser>({
      method: 'GET',
      url: '/auth/me/',
    });

    // Transform API response (snake_case) to frontend format (camelCase)
    const user = transformUser(apiUser);

    // Update local cache
    setUserData(user);

    return user;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: { name?: string; bio?: string }): Promise<User> {
    const apiUser = await apiRequest<ApiUser>({
      method: 'PATCH',
      url: '/auth/me/',
      data,
    });

    // Transform API response (snake_case) to frontend format (camelCase)
    const user = transformUser(apiUser);

    // Update local cache
    setUserData(user);

    return user;
  },
};
