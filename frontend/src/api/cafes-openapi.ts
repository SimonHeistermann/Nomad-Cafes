/**
 * Cafes API using type-safe OpenAPI client
 *
 * Uses openapi-fetch with auto-generated types and camelCase transformation middleware.
 */

import { api } from './openapi-client';
import type { components } from './generated/schema';

// Re-export schema types for reference (snake_case from schema)
type ApiCafeList = components['schemas']['CafeList'];
type ApiCafeDetail = components['schemas']['CafeDetail'];
type ApiTrendingLocation = components['schemas']['TrendingLocation'];
type ApiPaginatedCafeList = components['schemas']['PaginatedCafeListList'];

// camelCase versions (what the middleware transforms to)
export interface CafeList {
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
}

export interface CafeDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  overview: string;
  location: {
    id: string;
    name: string;
    slug: string;
    country: string;
    countryCode?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    cafeCount?: number;
    isFeatured?: boolean;
  };
  address: string;
  addressLine2?: string;
  postalCode?: string;
  city: string;
  latitude?: string | null;
  longitude?: string | null;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: unknown;
  imageUrl?: string;
  thumbnailUrl?: string;
  logoUrl?: string;
  gallery?: unknown;
  category?: string;
  categoryColor?: string;
  priceLevel?: string;
  features: unknown[];
  amenities?: unknown;
  openingHours?: unknown;
  timezone?: string;
  ratingAvg?: string;
  ratingCount?: number;
  ratingWifi?: string;
  ratingPower?: string;
  ratingNoise?: string;
  ratingCoffee?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  allowsContact?: boolean;
  owner?: {
    id: string;
    name?: string;
    displayName: string;
    avatarUrl?: string;
    role?: string;
  };
  ownerRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingLocation {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
  cafeCount?: number;
  countryCode?: string;
}

export interface PaginatedCafeList {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: CafeList[];
}

export interface CafeFilters {
  category?: string;
  priceRange?: string;
  location?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Type-safe Cafes API using openapi-fetch
 */
export const cafesApiOpenApi = {
  /**
   * Get list of cafes with filters and pagination
   */
  async getCafes(filters?: CafeFilters): Promise<PaginatedCafeList> {
    const { data, error } = await api.GET('/api/cafes/', {
      params: {
        query: {
          category: filters?.category && filters.category !== 'all' ? filters.category : undefined,
          // Note: price_range maps to price_level in backend
          price_level: filters?.priceRange && filters.priceRange !== 'any'
            ? parseInt(filters.priceRange, 10)
            : undefined,
          location: filters?.location && filters.location !== 'all' ? filters.location : undefined,
          tag: filters?.tag && filters.tag !== 'any' ? filters.tag : undefined,
          search: filters?.search || undefined,
          ordering: filters?.sortBy || undefined,
          page: filters?.page,
        },
      },
    });

    if (error) throw error;

    // The middleware transforms snake_case to camelCase
    return data as unknown as PaginatedCafeList;
  },

  /**
   * Get single cafe by slug
   */
  async getCafeBySlug(slug: string): Promise<CafeDetail> {
    const { data, error } = await api.GET('/api/cafes/{slug}/', {
      params: {
        path: { slug },
      },
    });

    if (error) throw error;

    return data as unknown as CafeDetail;
  },

  /**
   * Get popular cafes
   */
  async getPopularCafes(limit = 10): Promise<CafeList[]> {
    // Note: The popular endpoint returns different shape - check actual backend response
    const { data, error } = await api.GET('/api/cafes/popular/', {
      params: {
        query: {
          // The backend might accept page_size here - needs verification
        },
      },
    });

    if (error) throw error;

    // The response structure may vary - the schema shows CafeMinimal but actual might be array
    // Middleware transforms snake_case to camelCase
    const result = data as unknown;
    if (Array.isArray(result)) {
      return result as CafeList[];
    }
    // If paginated response
    if (result && typeof result === 'object' && 'results' in result) {
      return (result as { results: CafeList[] }).results;
    }
    return [result as CafeList];
  },

  /**
   * Get trending locations
   */
  async getTrendingLocations(): Promise<TrendingLocation[]> {
    const { data, error } = await api.GET('/api/locations/trending/');

    if (error) throw error;

    // The middleware transforms snake_case to camelCase automatically
    // Response is an array of TrendingLocation
    const result = data as unknown;
    if (Array.isArray(result)) {
      return result as TrendingLocation[];
    }
    return [result as TrendingLocation];
  },
};
