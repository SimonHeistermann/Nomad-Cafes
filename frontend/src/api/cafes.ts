import { apiRequest } from './client';
import type { Cafe } from '@/types/cafe';
import type { PaginatedResponse, CafeFilters } from './types';
import { transformLocations, type ApiLocation, type DisplayLocation } from './transformers';

export const cafesApi = {
  /**
   * Get list of cafes with filters and pagination
   */
  async getCafes(filters?: CafeFilters): Promise<PaginatedResponse<Cafe>> {
    const params = new URLSearchParams();

    if (filters?.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters?.priceRange && filters.priceRange !== 'any') {
      params.append('price_range', filters.priceRange);
    }
    if (filters?.location && filters.location !== 'all') {
      params.append('location', filters.location);
    }
    if (filters?.tag && filters.tag !== 'any') {
      params.append('tag', filters.tag);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.sortBy) {
      params.append('ordering', filters.sortBy);
    }
    if (filters?.page) {
      params.append('page', String(filters.page));
    }
    if (filters?.pageSize) {
      params.append('page_size', String(filters.pageSize));
    }

    return await apiRequest({
      method: 'GET',
      url: `/cafes/?${params.toString()}`,
    });
  },

  /**
   * Get single cafe by ID
   */
  async getCafeById(id: string): Promise<Cafe> {
    return await apiRequest({
      method: 'GET',
      url: `/cafes/${id}/`,
    });
  },

  /**
   * Get popular cafes
   */
  async getPopularCafes(limit = 10): Promise<Cafe[]> {
    const response = await apiRequest<PaginatedResponse<Cafe>>({
      method: 'GET',
      url: `/cafes/popular/?page_size=${limit}`,
    });
    return response.results;
  },

  /**
   * Get trending locations
   * Transforms API response to camelCase DisplayLocation format
   */
  async getTrendingLocations(language = 'en'): Promise<DisplayLocation[]> {
    const response = await apiRequest<ApiLocation[]>({
      method: 'GET',
      url: '/locations/trending/',
    });
    return transformLocations(response, language);
  },
};
