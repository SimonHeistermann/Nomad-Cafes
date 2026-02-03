/**
 * Hook for fetching stats from the backend API.
 */

import { useState, useEffect } from 'react';
import { api } from '@/api';

interface Stats {
  cafes: number;
  locations: number;
  users: number;
  reviews: number;
}

interface UseStatsResult {
  stats: Stats | null;
  isLoading: boolean;
  error: string | null;
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.core.getStats();
        // Backend returns: cafes, locations, users, reviews (not prefixed with "total")
        setStats({
          cafes: response.cafes ?? 0,
          locations: response.locations ?? 0,
          users: response.users ?? 0,
          reviews: response.reviews ?? 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
        // Fallback to default values
        setStats({ cafes: 0, locations: 0, users: 0, reviews: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}
