import { apiRequest } from './client';
import type { Cafe } from '@/types/cafe';
import type { PaginatedResponse } from './types';

export const favoritesApi = {
  /**
   * Get user's favorite cafes
   */
  async getFavorites(page = 1): Promise<PaginatedResponse<Cafe>> {
    return await apiRequest({
      method: 'GET',
      url: `/favorites/?page=${page}`,
    });
  },

  /**
   * Add a cafe to favorites
   */
  async addFavorite(cafeId: string): Promise<void> {
    await apiRequest({
      method: 'POST',
      url: '/favorites/',
      data: { cafe_id: cafeId },
    });
  },

  /**
   * Remove a cafe from favorites
   */
  async removeFavorite(cafeId: string): Promise<void> {
    await apiRequest({
      method: 'DELETE',
      url: `/favorites/${cafeId}/`,
    });
  },

  /**
   * Check if a cafe is favorited
   */
  async isFavorited(cafeId: string): Promise<boolean> {
    try {
      await apiRequest({
        method: 'GET',
        url: `/favorites/${cafeId}/`,
      });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Toggle favorite status
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
