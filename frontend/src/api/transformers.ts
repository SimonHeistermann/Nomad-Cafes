/**
 * Transformers to convert API responses to frontend types.
 *
 * The backend uses snake_case, the frontend uses camelCase.
 * This module handles the conversion.
 *
 * ## Migration Notice (Sprint 5)
 *
 * Many of these transformers are being deprecated in favor of the new
 * OpenAPI client (`openapi-client.ts`) which uses middleware to automatically
 * transform snake_case ↔ camelCase.
 *
 * ### Still Required (NOT deprecated)
 * - `transformCafe()` - Computes `isOpen` from opening hours and timezone
 * - `transformCafes()` - Uses transformCafe
 * - `transformOpeningHours()` - Nested structure transformation
 * - `transformLocation()` - Handles multilingual name field
 * - `transformLocations()` - Uses transformLocation
 *
 * ### Deprecated (use OpenAPI client instead)
 * - `transformUser()` - Simple field mapping, handled by middleware
 * - `transformReviewRequest()` - Simple field mapping, handled by middleware
 * - `transformPasswordResetRequest()` - Simple field mapping, handled by middleware
 * - `transformStats()` - Identity transform
 *
 * ### Using the new OpenAPI client
 * ```typescript
 * import { apiOpenApi } from '@/api';
 *
 * // Types are automatically transformed by middleware
 * const user = await apiOpenApi.auth.getCurrentUser();
 * console.log(user.avatarUrl); // camelCase automatically
 * ```
 */

import type { Cafe, OpeningHoursEntry } from '@/types/cafe';
import { getOpenStateForNow } from '@/lib/utils/opening-hours';

/**
 * Raw cafe response from API
 */
export interface ApiCafe {
  id: string;
  name: string;
  slug: string;
  description: string;
  overview?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  category_color: string;
  price_level: number;
  city: string;
  location_name?: string;
  rating_avg: string | number;
  rating_count: number;
  is_featured: boolean;
  is_favorited: boolean;
  is_verified?: boolean;
  // Backend now sends "features" (renamed from "tags")
  features: string[];

  // Detail fields (optional)
  address?: string;
  address_line_2?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
  gallery?: string[];
  amenities?: Record<string, boolean | string>;
  opening_hours?: Record<string, { open: string; close: string; is_closed?: boolean }>;
  timezone?: string;
  allows_contact?: boolean;
  owner_name?: string;
  owner_role?: string;
  logo_url?: string;
}

/**
 * Raw location response from API
 */
export interface ApiLocation {
  id: string;
  name: string | Record<string, string>;
  slug: string;
  country: string;
  country_code?: string;
  cafe_count: number;
  image_url?: string;
  thumbnail_url?: string;
  is_featured: boolean;
}

/**
 * Transform API opening_hours to frontend OpeningHoursEntry[]
 */
function transformOpeningHours(
  apiHours?: Record<string, { open: string; close: string; is_closed?: boolean }>
): OpeningHoursEntry[] | undefined {
  if (!apiHours) return undefined;

  return Object.entries(apiHours).map(([day, hours]) => ({
    day,
    open: hours.open,
    close: hours.close,
    isClosed: hours.is_closed,
  }));
}

/**
 * Transform API cafe to frontend Cafe type
 */
export function transformCafe(api: ApiCafe): Cafe {
  const rating = typeof api.rating_avg === 'string'
    ? parseFloat(api.rating_avg)
    : api.rating_avg;

  // Transform opening hours first so we can use it for isOpen calculation
  const openingHours = transformOpeningHours(api.opening_hours);

  // Calculate isOpen from opening hours and timezone
  // If no opening hours, default to true (assume open)
  const openState = getOpenStateForNow(openingHours ?? [], true, api.timezone);

  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    description: api.description,
    imageUrl: api.image_url,
    priceLevel: api.price_level,
    isOpen: openState.isOpenNow,
    isFeatured: api.is_featured,
    rating: isNaN(rating) ? 0 : rating,
    reviewCount: api.rating_count,
    phone: api.phone || '',
    city: api.city,
    timeZone: api.timezone,
    // Fallback to 'other' if category is missing/undefined
    category: api.category || 'other',
    categoryColor: api.category_color || '#9CA3AF',
    isFavorite: api.is_favorited,

    // Detail fields
    overview: api.overview ? { en: api.overview, de: api.overview } : undefined,
    addressLine1: api.address,
    addressLine2: api.address_line_2,
    latitude: api.latitude,
    longitude: api.longitude,
    websiteUrl: api.website,
    instagramUrl: api.social_links?.instagram,
    facebookUrl: api.social_links?.facebook,
    twitterUrl: api.social_links?.twitter,
    tiktokUrl: api.social_links?.tiktok,
    galleryImages: api.gallery,
    features: api.features,
    openingHours,
    allowsContact: api.allows_contact,
    ownerName: api.owner_name,
    ownerRole: api.owner_role,
    logoUrl: api.logo_url,
  };
}

/**
 * Transform array of API cafes
 */
export function transformCafes(apiCafes: ApiCafe[]): Cafe[] {
  return apiCafes.map(transformCafe);
}

/**
 * Location for display (simplified)
 */
export interface DisplayLocation {
  id: string;
  name: string;
  slug: string;
  countryCode?: string;
  cafeCount: number;
  imageUrl?: string;
}

/**
 * Transform API location
 */
export function transformLocation(api: ApiLocation, language = 'en'): DisplayLocation {
  const name = typeof api.name === 'string'
    ? api.name
    : (api.name[language] || api.name['en'] || Object.values(api.name)[0]);

  return {
    id: api.id,
    name,
    slug: api.slug,
    countryCode: api.country_code,
    cafeCount: api.cafe_count,
    imageUrl: api.image_url,
  };
}

/**
 * Transform array of API locations
 */
export function transformLocations(apiLocations: ApiLocation[], language = 'en'): DisplayLocation[] {
  return apiLocations.map(loc => transformLocation(loc, language));
}

// =============================================================================
// User Transformers
// =============================================================================

/**
 * Raw user response from API (snake_case)
 */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string | null;
  is_email_verified?: boolean;
  role?: string;
  created_at?: string;
}

/**
 * Frontend User type (camelCase)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
  role?: string;
  createdAt?: string;
}

/**
 * Transform API user to frontend User type
 *
 * @deprecated Use `apiOpenApi.auth.getCurrentUser()` instead.
 * The OpenAPI client middleware handles snake_case → camelCase automatically.
 */
export function transformUser(api: ApiUser): User {
  return {
    id: api.id,
    name: api.name,
    email: api.email,
    bio: api.bio,
    avatarUrl: api.avatar_url,
    isEmailVerified: api.is_email_verified,
    role: api.role,
    createdAt: api.created_at,
  };
}

// =============================================================================
// Review Request Transformers (camelCase -> snake_case for API)
// =============================================================================

/**
 * Frontend review request (camelCase)
 */
export interface ReviewCreateRequest {
  ratingOverall: number;
  ratingWifi?: number;
  ratingPower?: number;
  ratingNoise?: number;
  ratingCoffee?: number;
  text: string;
  language?: string;
}

/**
 * Transform frontend review request to API format (snake_case)
 *
 * @deprecated Use `apiOpenApi.reviews.createReview()` instead.
 * The OpenAPI client middleware handles camelCase → snake_case automatically.
 */
export function transformReviewRequest(request: ReviewCreateRequest): Record<string, unknown> {
  return {
    rating_overall: request.ratingOverall,
    rating_wifi: request.ratingWifi,
    rating_power: request.ratingPower,
    rating_noise: request.ratingNoise,
    rating_coffee: request.ratingCoffee,
    text: request.text,
    language: request.language,
  };
}

// =============================================================================
// Password Reset Transformer (camelCase -> snake_case for API)
// =============================================================================

/**
 * Frontend password reset confirm request (camelCase)
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

/**
 * Transform frontend password reset request to API format (snake_case)
 *
 * @deprecated Use `apiOpenApi.auth.confirmPasswordReset()` instead.
 * The OpenAPI client middleware handles camelCase → snake_case automatically.
 */
export function transformPasswordResetRequest(request: PasswordResetConfirmRequest): Record<string, unknown> {
  return {
    token: request.token,
    new_password: request.newPassword,
  };
}

// =============================================================================
// Stats Transformer
// =============================================================================

/**
 * Raw stats response from API
 */
export interface ApiStats {
  cafes: number;
  locations: number;
  users: number;
  reviews: number;
}

/**
 * Frontend stats type (same structure, but explicitly typed)
 */
export interface Stats {
  cafes: number;
  locations: number;
  users: number;
  reviews: number;
}

/**
 * Transform API stats (identity transform, but ensures type safety)
 *
 * @deprecated This is essentially an identity transform. Use the OpenAPI client directly.
 */
export function transformStats(api: ApiStats): Stats {
  return {
    cafes: api.cafes ?? 0,
    locations: api.locations ?? 0,
    users: api.users ?? 0,
    reviews: api.reviews ?? 0,
  };
}
