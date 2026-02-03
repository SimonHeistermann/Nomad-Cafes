import type { User } from './transformers';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * API Error interface for type checking
 */
export interface IApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  status?: number;
  requestId?: string;
}

/**
 * Custom Error class for API errors that preserves backend error structure.
 * Thrown by apiRequest() and can be caught to access code, details, and status.
 *
 * @example
 * try {
 *   await api.auth.login(credentials);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.log(error.code); // "validation_error"
 *     console.log(error.details); // { email: ["Invalid email"] }
 *     console.log(error.status); // 400
 *   }
 * }
 */
export class ApiError extends Error implements IApiError {
  public readonly code?: string;
  public readonly details?: Record<string, string[]>;
  public readonly status?: number;
  public readonly requestId?: string;

  constructor(
    message: string,
    code?: string,
    details?: Record<string, string[]>,
    status?: number,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
    this.requestId = requestId;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Check if this is a validation error with field-level details
   */
  isValidationError(): boolean {
    return this.code === 'validation_error' && !!this.details;
  }

  /**
   * Get validation error for a specific field
   */
  getFieldError(field: string): string[] | undefined {
    return this.details?.[field];
  }

  /**
   * Get the first validation error for a field (convenience method)
   */
  getFirstFieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
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

// Re-export User type from transformers for consistency
export type { User } from './transformers';

// Auth response - token is now in httpOnly cookie, not returned in response
export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

// Core API types
// Note: StatsResponse matches backend /api/stats/ response
export interface StatsResponse {
  cafes: number;
  locations: number;
  users: number;
  reviews: number;
}

// Re-export from generated types for health check
export type { HealthCheck as HealthResponse } from './generated';

// Contact types - using generated types
export type { ContactRequest as GeneratedContactRequest } from './generated';

// Frontend ContactRequest with camelCase for forms
export interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export interface CafeFilters {
  category?: string;
  priceRange?: string;
  location?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

// Re-export ReviewCreateRequest from transformers (camelCase)
export type { ReviewCreateRequest } from './transformers';

export interface PasswordResetRequest {
  email: string;
}

// Re-export PasswordResetConfirm from transformers (camelCase)
export type { PasswordResetConfirmRequest as PasswordResetConfirm } from './transformers';
