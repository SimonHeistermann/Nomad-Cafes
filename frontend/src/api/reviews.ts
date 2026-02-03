import { apiRequest } from './client';
import { transformReviewRequest } from './transformers';
import type { CafeReview, UserReview } from '@/types/cafe';
import type { ReviewCreateRequest, PaginatedResponse } from './types';

// API response type for cafe reviews list (snake_case)
interface ApiCafeReview {
  id: string;
  author_name: string;
  author_avatar_url: string | null;
  rating_overall: number;
  rating_wifi: number | null;
  rating_power: number | null;
  rating_noise: number | null;
  rating_coffee: number | null;
  text: string;
  language: string;
  photos: string[];
  is_verified: boolean;
  created_at: string;
}

// API response type for user reviews (snake_case)
interface ApiUserReview {
  id: string;
  cafe_id: string;
  cafe_name: string;
  cafe_slug: string;
  cafe_thumbnail: string | null;
  cafe_city: string;
  rating_overall: number;
  rating_wifi: number | null;
  rating_power: number | null;
  rating_noise: number | null;
  rating_coffee: number | null;
  text: string;
  language: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Transform API cafe review to frontend CafeReview type
 */
export function transformCafeReview(api: ApiCafeReview): CafeReview {
  return {
    id: api.id,
    authorName: api.author_name,
    authorAvatarUrl: api.author_avatar_url || undefined,
    createdAt: api.created_at,
    ratingOverall: api.rating_overall,
    ratingWifi: api.rating_wifi,
    ratingPower: api.rating_power,
    ratingNoise: api.rating_noise,
    ratingCoffee: api.rating_coffee,
    text: api.text,
    language: api.language,
    photos: api.photos,
  };
}

function transformUserReview(api: ApiUserReview): UserReview {
  return {
    id: api.id,
    cafeId: api.cafe_id,
    cafeName: api.cafe_name,
    cafeSlug: api.cafe_slug,
    cafeThumbnail: api.cafe_thumbnail || undefined,
    cafeCity: api.cafe_city,
    ratingOverall: api.rating_overall,
    ratingWifi: api.rating_wifi,
    ratingPower: api.rating_power,
    ratingNoise: api.rating_noise,
    ratingCoffee: api.rating_coffee,
    text: api.text,
    language: api.language || undefined,
    photos: api.photos,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export const reviewsApi = {
  /**
   * Get reviews for a cafe
   */
  async getReviewsForCafe(
    cafeId: string,
    page = 1,
  ): Promise<PaginatedResponse<CafeReview>> {
    const response = await apiRequest<PaginatedResponse<ApiCafeReview>>({
      method: 'GET',
      url: `/cafes/${cafeId}/reviews/?page=${page}`,
    });
    return {
      ...response,
      results: response.results.map(transformCafeReview),
    };
  },

  /**
   * Create a new review for a cafe
   */
  async createReview(
    cafeId: string,
    reviewData: ReviewCreateRequest,
  ): Promise<CafeReview> {
    const apiResponse = await apiRequest<ApiCafeReview>({
      method: 'POST',
      url: `/cafes/${cafeId}/reviews/`,
      data: transformReviewRequest(reviewData),
    });
    return transformCafeReview(apiResponse);
  },

  /**
   * Update an existing review
   */
  async updateReview(
    cafeId: string,
    reviewId: string,
    reviewData: Partial<ReviewCreateRequest>,
  ): Promise<CafeReview> {
    // Transform partial request - only include defined fields
    const transformedData: Record<string, unknown> = {};
    if (reviewData.ratingOverall !== undefined) transformedData.rating_overall = reviewData.ratingOverall;
    if (reviewData.ratingWifi !== undefined) transformedData.rating_wifi = reviewData.ratingWifi;
    if (reviewData.ratingPower !== undefined) transformedData.rating_power = reviewData.ratingPower;
    if (reviewData.ratingNoise !== undefined) transformedData.rating_noise = reviewData.ratingNoise;
    if (reviewData.ratingCoffee !== undefined) transformedData.rating_coffee = reviewData.ratingCoffee;
    if (reviewData.text !== undefined) transformedData.text = reviewData.text;
    if (reviewData.language !== undefined) transformedData.language = reviewData.language;

    const apiResponse = await apiRequest<ApiCafeReview>({
      method: 'PATCH',
      url: `/cafes/${cafeId}/reviews/${reviewId}/`,
      data: transformedData,
    });
    return transformCafeReview(apiResponse);
  },

  /**
   * Delete a review
   */
  async deleteReview(cafeId: string, reviewId: string): Promise<void> {
    await apiRequest({
      method: 'DELETE',
      url: `/cafes/${cafeId}/reviews/${reviewId}/`,
    });
  },

  /**
   * Get user's own reviews
   */
  async getMyReviews(page = 1): Promise<PaginatedResponse<UserReview>> {
    const response = await apiRequest<PaginatedResponse<ApiUserReview>>({
      method: 'GET',
      url: `/reviews/me/?page=${page}`,
    });
    return {
      ...response,
      results: response.results.map(transformUserReview),
    };
  },
};
