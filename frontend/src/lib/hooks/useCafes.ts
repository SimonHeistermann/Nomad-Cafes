/**
 * Hook for fetching cafes from the backend API.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { transformCafes, type ApiCafe } from '@/api/transformers';
import { useToast } from '@/contexts';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import type { Cafe } from '@/types/cafe';

interface UseCafesFilters {
  category?: string;
  priceRange?: string;
  tag?: string;
  sortBy?: string;
  query?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

interface UseCafesResult {
  cafes: Cafe[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface ApiPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiCafe[];
}

export function useCafes(filters: UseCafesFilters = {}): UseCafesResult {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const pageSize = filters.pageSize || 12;
  const currentPage = filters.page || 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchCafes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Category filter
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }

      // Price range filter (convert frontend format to API format)
      if (filters.priceRange && filters.priceRange !== 'any') {
        // Frontend uses: 'budget', 'mid', 'premium'
        // API expects: price_level (1-4)
        const priceMap: Record<string, string> = {
          budget: '1',
          mid: '2',
          premium: '3,4',
        };
        const priceLevel = priceMap[filters.priceRange];
        if (priceLevel) {
          params.append('price_level', priceLevel);
        }
      }

      // Tag filter
      if (filters.tag && filters.tag !== 'any') {
        params.append('tag', filters.tag);
      }

      // Location filter - use 'location' param for slug-based filtering
      if (filters.location && filters.location !== 'any' && filters.location !== 'all') {
        params.append('location', filters.location);
      }

      // Search query
      if (filters.query) {
        params.append('search', filters.query);
      }

      // Sort order
      if (filters.sortBy && filters.sortBy !== 'default') {
        const sortMap: Record<string, string> = {
          rating: '-rating_avg',
          newest: '-created_at',
          name: 'name',
          price_low: 'price_level',
          price_high: '-price_level',
        };
        const ordering = sortMap[filters.sortBy];
        if (ordering) {
          params.append('ordering', ordering);
        }
      }

      // Pagination
      params.append('page', String(currentPage));
      params.append('page_size', String(pageSize));

      const response = await apiClient.get<ApiPaginatedResponse>(`/cafes/?${params.toString()}`);

      setCafes(transformCafes(response.data.results));
      setTotalCount(response.data.count);
    } catch (err) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx) → inline error state
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }
      setCafes([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.category,
    filters.priceRange,
    filters.tag,
    filters.sortBy,
    filters.query,
    filters.location,
    currentPage,
    pageSize,
    showError,
  ]);

  useEffect(() => {
    fetchCafes();
  }, [fetchCafes]);

  return {
    cafes,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    error,
    refetch: fetchCafes,
  };
}

/**
 * Hook for fetching a single cafe by ID or slug
 */
export function useCafe(idOrSlug: string | undefined): {
  cafe: Cafe | null;
  isLoading: boolean;
  error: string | null;
} {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    if (!idOrSlug) {
      setIsLoading(false);
      return;
    }

    const fetchCafe = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ApiCafe>(`/cafes/${idOrSlug}/`);
        setCafe(transformCafes([response.data])[0]);
      } catch (err) {
        // Server errors (5xx, network) → Toast notification
        // User errors (4xx like 404) → inline error state
        if (isServerError(err)) {
          showError(getServerErrorMessage(err));
        } else {
          setError(getErrorMessage(err));
        }
        setCafe(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCafe();
  }, [idOrSlug, showError]);

  return { cafe, isLoading, error };
}

/**
 * Hook for fetching popular cafes
 * Note: Popular endpoint returns array directly, not paginated
 */
export function usePopularCafes(limit = 6): {
  cafes: Cafe[];
  isLoading: boolean;
  error: string | null;
} {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    const fetchPopular = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Popular endpoint returns array directly, not paginated
        const response = await apiClient.get<ApiCafe[]>(
          `/cafes/popular/?page_size=${limit}`
        );
        setCafes(transformCafes(response.data));
      } catch (err) {
        // Server errors (5xx, network) → Toast notification
        // User errors (4xx) → inline error state
        if (isServerError(err)) {
          showError(getServerErrorMessage(err));
        } else {
          setError(getErrorMessage(err));
        }
        setCafes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopular();
  }, [limit, showError]);

  return { cafes, isLoading, error };
}
