/**
 * Re-exports from auto-generated OpenAPI types.
 *
 * This file provides convenient access to commonly used types from the
 * generated schema. Import from here instead of schema.ts directly.
 *
 * Usage:
 *   import type { HealthCheck, ReviewList, CafeDetail } from '@/api/generated';
 *
 * To regenerate types:
 *   npm run generate:api        # From live backend
 *   npm run generate:api:file   # From local schema file
 */

import type { components, operations } from './schema';

// ============================================================================
// Type Aliases for Components
// ============================================================================

// Auth & User types
export type User = components['schemas']['User'];
export type UserProfileUpdate = components['schemas']['UserProfileUpdate'];

// Cafe types
export type CafeList = components['schemas']['CafeList'];
export type CafeDetail = components['schemas']['CafeDetail'];
export type CafeMinimal = components['schemas']['CafeMinimal'];
export type CategoryEnum = components['schemas']['CategoryEnum'];
export type PriceLevelEnum = components['schemas']['PriceLevelEnum'];

// Review types
export type ReviewList = components['schemas']['ReviewList'];
export type ReviewDetail = components['schemas']['ReviewDetail'];
export type ReviewCreate = components['schemas']['ReviewCreate'];
export type ReviewCreateRequest = components['schemas']['ReviewCreateRequest'];
export type UserReview = components['schemas']['UserReview'];

// Location types
export type LocationList = components['schemas']['LocationList'];
export type TrendingLocation = components['schemas']['TrendingLocation'];

// Bookmark types
export type Bookmark = components['schemas']['Bookmark'];
export type BookmarkRequest = components['schemas']['BookmarkRequest'];

// Core types
export type HealthCheck = components['schemas']['HealthCheck'];
export type Contact = components['schemas']['Contact'];
export type ContactRequest = components['schemas']['ContactRequest'];
export type SubjectEnum = components['schemas']['SubjectEnum'];

// Pagination types
export type PaginatedCafeListList = components['schemas']['PaginatedCafeListList'];
export type PaginatedReviewListList = components['schemas']['PaginatedReviewListList'];
export type PaginatedUserReviewList = components['schemas']['PaginatedUserReviewList'];
export type PaginatedLocationListList = components['schemas']['PaginatedLocationListList'];

// ============================================================================
// Re-export full types for advanced usage
// ============================================================================

export type { components, operations };
