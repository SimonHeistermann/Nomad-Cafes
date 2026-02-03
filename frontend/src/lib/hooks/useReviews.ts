/**
 * Hook for fetching cafe reviews from the backend API.
 * Uses the centralized api layer for data fetching and transformation.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import { useToast } from '@/contexts';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import type { CafeReview } from '@/types/cafe';

interface UseReviewsResult {
  reviews: CafeReview[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching reviews for a specific cafe
 */
export function useReviews(cafeSlug: string | undefined): UseReviewsResult {
  const [reviews, setReviews] = useState<CafeReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!cafeSlug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.reviews.getReviewsForCafe(cafeSlug);
      setReviews(response.results);
      setTotalCount(response.count);
    } catch (err: unknown) {
      // Handle 404 gracefully as "no reviews yet" instead of error
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const status = isAxiosError ? (err as { response?: { status?: number } }).response?.status : undefined;

      if (status === 404) {
        // Cafe has no reviews or reviews endpoint not available for this cafe
        // This is not an error condition - just means no reviews
        setReviews([]);
        setTotalCount(0);
        setError(null);
      } else if (isServerError(err)) {
        // Server errors (5xx, network) → Toast notification
        showError(getServerErrorMessage(err));
        setReviews([]);
        setTotalCount(0);
      } else {
        // User errors (4xx except 404) → inline error state
        setError(getErrorMessage(err));
        setReviews([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cafeSlug, showError]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    totalCount,
    isLoading,
    error,
    refetch: fetchReviews,
  };
}

/**
 * Calculate reviews summary from reviews array
 */
export function calculateReviewsSummary(reviews: CafeReview[]): {
  overall: number;
  wifi: number;
  power: number;
  noise: number;
  coffee: number;
} {
  if (reviews.length === 0) {
    return { overall: 0, wifi: 0, power: 0, noise: 0, coffee: 0 };
  }

  const sum = reviews.reduce(
    (acc, review) => ({
      overall: acc.overall + review.ratingOverall,
      wifi: acc.wifi + (review.ratingWifi || 0),
      power: acc.power + (review.ratingPower || 0),
      noise: acc.noise + (review.ratingNoise || 0),
      coffee: acc.coffee + (review.ratingCoffee || 0),
    }),
    { overall: 0, wifi: 0, power: 0, noise: 0, coffee: 0 }
  );

  // Count reviews that have each rating (since they're optional)
  const wifiCount = reviews.filter(r => r.ratingWifi != null).length;
  const powerCount = reviews.filter(r => r.ratingPower != null).length;
  const noiseCount = reviews.filter(r => r.ratingNoise != null).length;
  const coffeeCount = reviews.filter(r => r.ratingCoffee != null).length;
  const count = reviews.length;

  return {
    overall: Math.round((sum.overall / count) * 10) / 10,
    wifi: wifiCount > 0 ? Math.round((sum.wifi / wifiCount) * 10) / 10 : 0,
    power: powerCount > 0 ? Math.round((sum.power / powerCount) * 10) / 10 : 0,
    noise: noiseCount > 0 ? Math.round((sum.noise / noiseCount) * 10) / 10 : 0,
    coffee: coffeeCount > 0 ? Math.round((sum.coffee / coffeeCount) * 10) / 10 : 0,
  };
}
