/**
 * Hook for fetching locations from the backend API.
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { transformLocations, type ApiLocation, type DisplayLocation } from '@/api/transformers';
import { useTranslation } from 'react-i18next';

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiLocation[];
}

interface UseLocationsResult {
  locations: DisplayLocation[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for fetching all locations
 */
export function useLocations(): UseLocationsResult {
  const { i18n } = useTranslation();
  const [locations, setLocations] = useState<DisplayLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<PaginatedResponse>('/locations/');
        setLocations(transformLocations(response.data.results, i18n.language));
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load locations');
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [i18n.language]);

  return { locations, isLoading, error };
}

/**
 * Hook for fetching trending locations
 * Note: Trending endpoint returns array directly, not paginated
 */
export function useTrendingLocations(limit = 6): UseLocationsResult {
  const { i18n } = useTranslation();
  const [locations, setLocations] = useState<DisplayLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Trending endpoint returns array directly, not paginated
        const response = await apiClient.get<ApiLocation[]>(
          `/locations/trending/?limit=${limit}`
        );
        setLocations(transformLocations(response.data, i18n.language));
      } catch (err) {
        console.error('Error fetching trending locations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trending locations');
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [limit, i18n.language]);

  return { locations, isLoading, error };
}

/**
 * Hook for getting top location names (for Hero text, etc.)
 * Uses trending locations endpoint for consistency across the app
 */
export function useTopLocationNames(count = 2): {
  names: string[];
  isLoading: boolean;
} {
  const { locations, isLoading } = useTrendingLocations(count);
  const names = locations.map(loc => loc.name);
  return { names, isLoading };
}

/**
 * Hook for location dropdown options
 * Returns locations formatted for dropdown/select components
 */
export interface LocationOption {
  value: string;
  label: string;
}

export function useLocationOptions(): {
  options: LocationOption[];
  isLoading: boolean;
  error: string | null;
} {
  const { t } = useTranslation();
  const { locations, isLoading, error } = useLocations();

  const options: LocationOption[] = [
    { value: 'any', label: t('locations.any') },
    ...locations.map(loc => ({
      value: loc.slug,
      label: loc.name,
    })),
  ];

  return { options, isLoading, error };
}
