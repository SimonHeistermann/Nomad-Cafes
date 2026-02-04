import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/api/client';
import { transformCafes, type ApiCafe } from '@/api/transformers';
import type { Cafe } from '@/types/cafe';

export interface UseSearchOptions {
  query: string;
  location: string;
  debounceMs?: number;
  category?: string;
  priceRange?: string;
  tag?: string;
  sortBy?: string;
}

export interface UseSearchResult {
  results: Cafe[];
  isSearching: boolean;
  hasSearched: boolean;
}

interface ApiPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiCafe[];
}

/**
 * Custom hook for live searching cafes with debouncing
 * Uses the backend API for searching
 * @param options Search parameters
 * @returns Search results, loading state, and search status
 */
export function useSearch({
  query,
  location,
  debounceMs = 300,
  category = 'all',
  priceRange = 'any',
  tag = 'any',
  sortBy = 'default',
}: UseSearchOptions): UseSearchResult {
  const [results, setResults] = useState<Cafe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current !== null) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    // Abort previous search request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // If query is empty and no filters, clear results immediately
    if (!query.trim() && location === 'any' && category === 'all' && tag === 'any') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Early return to reset state
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    // Set searching state immediately
    setIsSearching(true);

    // Debounce the search
    debounceTimeoutRef.current = window.setTimeout(async () => {
      // Create abort controller for this search
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Build query params for API
        const params = new URLSearchParams();

        // Search query
        if (query.trim()) {
          params.append('search', query.trim());
        }

        // Location filter - use 'location' param for slug-based filtering
        if (location && location !== 'any' && location !== 'all') {
          params.append('location', location);
        }

        // Category filter
        if (category && category !== 'all') {
          params.append('category', category);
        }

        // Price range filter
        if (priceRange && priceRange !== 'any') {
          const priceMap: Record<string, string> = {
            budget: '1',
            mid: '2',
            premium: '3,4',
          };
          const priceLevel = priceMap[priceRange];
          if (priceLevel) {
            params.append('price_level', priceLevel);
          }
        }

        // Tag filter
        if (tag && tag !== 'any') {
          params.append('tag', tag);
        }

        // Sort order
        if (sortBy && sortBy !== 'default') {
          const sortMap: Record<string, string> = {
            rating: '-rating_avg',
            newest: '-created_at',
            name: 'name',
            price_low: 'price_level',
            price_high: '-price_level',
          };
          const ordering = sortMap[sortBy];
          if (ordering) {
            params.append('ordering', ordering);
          }
        }

        // Fetch from API
        const response = await apiClient.get<ApiPaginatedResponse>(
          `/cafes/?${params.toString()}`,
          { signal: controller.signal }
        );

        // Only update if not aborted
        if (!controller.signal.aborted) {
          setResults(transformCafes(response.data.results));
          setIsSearching(false);
          setHasSearched(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Search error:', error);
          setResults([]);
          setIsSearching(false);
          setHasSearched(true);
        }
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current !== null) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, location, category, priceRange, tag, sortBy, debounceMs]);

  return { results, isSearching, hasSearched };
}
