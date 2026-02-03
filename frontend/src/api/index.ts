/**
 * API Client
 *
 * Centralized API layer for the Nomad Cafe application.
 * Provides type-safe methods for interacting with the backend.
 *
 * Authentication is handled via httpOnly cookies (not localStorage tokens).
 *
 * Usage:
 * ```typescript
 * import { api } from '@/api';
 *
 * // Get cafes
 * const cafes = await api.cafes.getCafes({ category: 'coffee-shop' });
 *
 * // Login (sets httpOnly cookie automatically)
 * const { user } = await api.auth.login({ email, password });
 *
 * // Add favorite
 * await api.favorites.addFavorite(cafeId);
 *
 * // Get stats
 * const stats = await api.core.getStats();
 * ```
 *
 * NEW: Type-safe OpenAPI client (experimental)
 * ```typescript
 * import { apiOpenApi } from '@/api';
 *
 * // Same API but with auto-generated types from OpenAPI schema
 * const { user } = await apiOpenApi.auth.login({ email, password });
 * ```
 */

import { authApi } from './auth';
import { cafesApi } from './cafes';
import { reviewsApi } from './reviews';
import { favoritesApi } from './favorites';
import { coreApi } from './core';

// New OpenAPI-based APIs
import { authApiOpenApi } from './auth-openapi';
import { cafesApiOpenApi } from './cafes-openapi';
import { reviewsApiOpenApi } from './reviews-openapi';
import { favoritesApiOpenApi } from './favorites-openapi';

export { apiClient, isAuthenticated, setUserData, clearUserData, getUserData } from './client';
export { authApi } from './auth';
export { cafesApi } from './cafes';
export { reviewsApi } from './reviews';
export { favoritesApi } from './favorites';
export { coreApi } from './core';
export * from './types';

// Export new OpenAPI-based APIs
export { authApiOpenApi } from './auth-openapi';
export { cafesApiOpenApi } from './cafes-openapi';
export { reviewsApiOpenApi } from './reviews-openapi';
export { favoritesApiOpenApi } from './favorites-openapi';

// Export the openapi-fetch client for direct usage
export { api as openapiClient } from './openapi-client';

// Grouped API object for convenient imports (legacy)
export const api = {
  auth: authApi,
  cafes: cafesApi,
  reviews: reviewsApi,
  favorites: favoritesApi,
  core: coreApi,
} as const;

// New grouped API object using OpenAPI client (recommended)
export const apiOpenApi = {
  auth: authApiOpenApi,
  cafes: cafesApiOpenApi,
  reviews: reviewsApiOpenApi,
  favorites: favoritesApiOpenApi,
  // core: still uses legacy API (no OpenAPI version yet)
  core: coreApi,
} as const;
