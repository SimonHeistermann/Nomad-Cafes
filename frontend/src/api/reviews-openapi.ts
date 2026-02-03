/**
 * Reviews API using type-safe OpenAPI client
 *
 * Uses openapi-fetch with auto-generated types and camelCase transformation middleware.
 */

import { api } from './openapi-client';
import type { components } from './generated/schema';

// API types (snake_case from schema)
type ApiReviewCreate = components['schemas']['ReviewCreateRequest'];
type ApiUserReview = components['schemas']['UserReview'];

// camelCase versions (what the middleware transforms to)
export interface CafeReview {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  ratingOverall: number;
  ratingWifi?: number | null;
  ratingPower?: number | null;
  ratingNoise?: number | null;
  ratingCoffee?: number | null;
  text: string;
  language: string;
  photos: string[];
  isVerified?: boolean;
  createdAt: string;
}

export interface UserReview {
  id: string;
  cafeId: string;
  cafeName: string;
  cafeSlug: string;
  cafeThumbnail?: string;
  cafeCity: string;
  ratingOverall: number;
  ratingWifi?: number | null;
  ratingPower?: number | null;
  ratingNoise?: number | null;
  ratingCoffee?: number | null;
  text: string;
  language?: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateRequest {
  ratingOverall: number;
  ratingWifi?: number | null;
  ratingPower?: number | null;
  ratingNoise?: number | null;
  ratingCoffee?: number | null;
  text: string;
  language?: string;
  photos?: string[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Type-safe Reviews API using openapi-fetch
 */
export const reviewsApiOpenApi = {
  /**
   * Get reviews for a cafe
   */
  async getReviewsForCafe(
    cafeSlug: string,
    page = 1,
  ): Promise<PaginatedResponse<CafeReview>> {
    const { data, error } = await api.GET('/api/cafes/{cafe_slug}/reviews/', {
      params: {
        path: { cafe_slug: cafeSlug },
        query: { page },
      },
    });

    if (error) throw error;

    // Middleware transforms snake_case to camelCase
    return data as unknown as PaginatedResponse<CafeReview>;
  },

  /**
   * Create a new review for a cafe
   * The middleware transforms camelCase request to snake_case automatically
   */
  async createReview(
    cafeSlug: string,
    reviewData: ReviewCreateRequest,
  ): Promise<CafeReview> {
    const { data, error } = await api.POST('/api/cafes/{cafe_slug}/reviews/', {
      params: {
        path: { cafe_slug: cafeSlug },
      },
      body: reviewData as unknown as ApiReviewCreate,
    });

    if (error) throw error;

    return data as unknown as CafeReview;
  },

  /**
   * Update an existing review
   */
  async updateReview(
    cafeSlug: string,
    reviewId: string,
    reviewData: Partial<ReviewCreateRequest>,
  ): Promise<CafeReview> {
    const { data, error } = await api.PATCH('/api/cafes/{cafe_slug}/reviews/{id}/', {
      params: {
        path: {
          cafe_slug: cafeSlug,
          id: reviewId,
        },
      },
      // Middleware transforms camelCase to snake_case
      body: reviewData as unknown,
    });

    if (error) throw error;

    return data as unknown as CafeReview;
  },

  /**
   * Delete a review
   */
  async deleteReview(cafeSlug: string, reviewId: string): Promise<void> {
    const { error } = await api.DELETE('/api/cafes/{cafe_slug}/reviews/{id}/', {
      params: {
        path: {
          cafe_slug: cafeSlug,
          id: reviewId,
        },
      },
    });

    if (error) throw error;
  },

  /**
   * Get user's own reviews
   */
  async getMyReviews(page = 1): Promise<PaginatedResponse<UserReview>> {
    const { data, error } = await api.GET('/api/reviews/', {
      params: {
        query: { page },
      },
    });

    if (error) throw error;

    return data as unknown as PaginatedResponse<UserReview>;
  },
};
