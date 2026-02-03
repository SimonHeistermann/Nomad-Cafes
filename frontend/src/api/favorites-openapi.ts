/**
 * Favorites/Bookmarks API using type-safe OpenAPI client
 *
 * Uses openapi-fetch with auto-generated types and camelCase transformation middleware.
 * Note: Backend uses "bookmarks" but frontend uses "favorites" terminology.
 */

import { api } from './openapi-client';
import type { components } from './generated/schema';

// API types (snake_case from schema)
type ApiBookmark = components['schemas']['Bookmark'];

// camelCase versions (what the middleware transforms to)
export interface Bookmark {
  id: string;
  cafe: {
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    logoUrl?: string;
    category?: string;
    categoryColor?: string;
    priceLevel?: string;
    city: string;
    locationName: string;
    phone?: string;
    ratingAvg?: string;
    ratingCount?: number;
    isFeatured?: boolean;
    isBookmarked: string;
    features: unknown[];
  };
  createdAt: string;
}

export interface PaginatedBookmarks {
  count: number;
  next: string | null;
  previous: string | null;
  results: Bookmark[];
}

/**
 * Type-safe Favorites/Bookmarks API using openapi-fetch
 */
export const favoritesApiOpenApi = {
  /**
   * Get user's favorite/bookmarked cafes
   */
  async getFavorites(page = 1): Promise<PaginatedBookmarks> {
    const { data, error } = await api.GET('/api/bookmarks/', {
      params: {
        query: { page },
      },
    });

    if (error) throw error;

    // Middleware transforms snake_case to camelCase
    return data as unknown as PaginatedBookmarks;
  },

  /**
   * Add a cafe to favorites/bookmarks
   */
  async addFavorite(cafeId: string): Promise<Bookmark> {
    const { data, error } = await api.POST('/api/bookmarks/', {
      body: { cafe_id: cafeId },
    });

    if (error) throw error;

    return data as unknown as Bookmark;
  },

  /**
   * Remove a cafe from favorites/bookmarks
   */
  async removeFavorite(cafeId: string): Promise<void> {
    const { error } = await api.DELETE('/api/bookmarks/{cafe_id}/', {
      params: {
        path: { cafe_id: cafeId },
      },
    });

    if (error) throw error;
  },

  /**
   * Check if a cafe is favorited/bookmarked
   */
  async isFavorited(cafeId: string): Promise<boolean> {
    const { data, error } = await api.GET('/api/bookmarks/{cafe_id}/', {
      params: {
        path: { cafe_id: cafeId },
      },
    });

    if (error) {
      // 404 means not bookmarked
      return false;
    }

    // Response includes is_bookmarked field
    const result = data as unknown as { isBookmarked: boolean };
    return result.isBookmarked;
  },

  /**
   * Toggle favorite/bookmark status
   */
  async toggleFavorite(cafeId: string, isCurrentlyFavorited: boolean): Promise<boolean> {
    if (isCurrentlyFavorited) {
      await this.removeFavorite(cafeId);
      return false;
    } else {
      await this.addFavorite(cafeId);
      return true;
    }
  },
};
