/**
 * Context for managing user favorites across the app.
 * Provides favorite state and toggle functionality that syncs with the backend.
 *
 * This context consolidates all favorites functionality:
 * - Tracking favorite IDs for quick lookups (isFavorite)
 * - Full cafe objects for the Favorites page
 * - Add/remove/toggle operations
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient } from '@/api/client';
import { transformCafe, type ApiCafe } from '@/api/transformers';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import type { Cafe } from '@/types/cafe';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface ApiFavorite {
  id: string;
  cafe: ApiCafe;
  created_at: string;
}

interface FavoritesContextValue {
  /** Set of favorite cafe IDs for quick lookup */
  favoriteIds: Set<string>;
  /** Full list of favorite cafes with all data */
  favorites: Cafe[];
  /** Check if a cafe is favorited */
  isFavorite: (cafeId: string) => boolean;
  /** Toggle favorite status (add if not favorited, remove if favorited) */
  toggleFavorite: (cafeId: string) => Promise<void>;
  /** Add a cafe to favorites */
  addFavorite: (cafeId: string) => Promise<void>;
  /** Remove a cafe from favorites */
  removeFavorite: (cafeId: string) => Promise<void>;
  /** Refetch favorites from server */
  refetch: () => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showError } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites when user logs in
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ results: ApiFavorite[] } | ApiFavorite[]>('/favorites/');
      const data = Array.isArray(response.data) ? response.data : response.data.results;

      // Extract IDs and transform cafes
      const ids = new Set(data.map(b => b.cafe.id));
      const cafes = data.map(b => transformCafe(b.cafe));

      setFavoriteIds(ids);
      setFavorites(cafes);
    } catch (err) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx) → inline error state
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }
      setFavoriteIds(new Set());
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, showError]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = useCallback((cafeId: string) => {
    return favoriteIds.has(cafeId);
  }, [favoriteIds]);

  const addFavorite = useCallback(async (cafeId: string) => {
    if (!isAuthenticated) return;

    try {
      await apiClient.post('/favorites/', { cafe_id: cafeId });
      // Refetch to get the full cafe data
      await fetchFavorites();
    } catch (err) {
      // Server errors → Toast, user errors → also toast for mutations
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        showError(getErrorMessage(err));
      }
      throw err;
    }
  }, [isAuthenticated, fetchFavorites, showError]);

  const removeFavorite = useCallback(async (cafeId: string) => {
    if (!isAuthenticated) return;

    // Optimistic update for better UX
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.delete(cafeId);
      return next;
    });
    setFavorites(prev => prev.filter(c => c.id !== cafeId));

    try {
      await apiClient.delete(`/favorites/${cafeId}/`);
    } catch (err) {
      // Server errors → Toast, user errors → also toast for mutations
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        showError(getErrorMessage(err));
      }
      // Revert on error by refetching
      await fetchFavorites();
      throw err;
    }
  }, [isAuthenticated, fetchFavorites, showError]);

  const toggleFavorite = useCallback(async (cafeId: string) => {
    if (!isAuthenticated) return;

    const wasFavorited = favoriteIds.has(cafeId);

    // Optimistic update for ID set (quick toggle feedback)
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(cafeId);
      } else {
        next.add(cafeId);
      }
      return next;
    });

    // Also update favorites array for removals
    if (wasFavorited) {
      setFavorites(prev => prev.filter(c => c.id !== cafeId));
    }

    try {
      if (wasFavorited) {
        await apiClient.delete(`/favorites/${cafeId}/`);
      } else {
        await apiClient.post('/favorites/', { cafe_id: cafeId });
        // Refetch to get the new cafe's full data
        await fetchFavorites();
      }
    } catch (err) {
      // Server errors → Toast, user errors → also toast for mutations
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        showError(getErrorMessage(err));
      }
      // Revert on error by refetching
      await fetchFavorites();
    }
  }, [isAuthenticated, favoriteIds, fetchFavorites, showError]);

  const value = useMemo(() => ({
    favoriteIds,
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refetch: fetchFavorites,
    isLoading,
    error,
  }), [favoriteIds, favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite, fetchFavorites, isLoading, error]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
