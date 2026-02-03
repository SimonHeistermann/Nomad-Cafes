/**
 * Location constants for consistent location handling across the app.
 * These slugs are used in URLs, filtering, and navigation.
 *
 * TODO: DATABASE MIGRATION
 * These hardcoded location constants are temporary for development.
 * In production, locations should be:
 * - Fetched dynamically from the database via API endpoint (e.g., GET /api/locations)
 * - Cached in the frontend to reduce API calls
 * - Support dynamic addition/removal of locations without code changes
 * - Include additional metadata (coordinates, timezone, currency, etc.)
 */

export const LOCATION_SLUGS = {
  ANY: 'any',
  BALI: 'bali',
  LOMBOK: 'lombok',
  CHIANG_MAI: 'chiang-mai',
  LISBON: 'lisbon',
  SIARGAO: 'siargao',
  BANGKOK: 'bangkok',
  HO_CHI_MINH: 'ho-chi-minh',
  HANOI: 'hanoi',
  BARCELONA: 'barcelona',
  MEXICO_CITY: 'mexico-city',
  MEDELLIN: 'medellin',
} as const;

export type LocationSlug = typeof LOCATION_SLUGS[keyof typeof LOCATION_SLUGS];

/**
 * Map of location slugs to their display labels
 *
 * TODO: DATABASE MIGRATION
 * Location labels should come from the database with i18n support.
 * The API should return labels in the user's selected language.
 */
export const LOCATION_LABELS: Record<string, string> = {
  [LOCATION_SLUGS.ANY]: 'Any location',
  [LOCATION_SLUGS.BALI]: 'Bali',
  [LOCATION_SLUGS.LOMBOK]: 'Lombok',
  [LOCATION_SLUGS.CHIANG_MAI]: 'Chiang Mai',
  [LOCATION_SLUGS.LISBON]: 'Lisbon',
  [LOCATION_SLUGS.SIARGAO]: 'Siargao',
  [LOCATION_SLUGS.BANGKOK]: 'Bangkok',
  [LOCATION_SLUGS.HO_CHI_MINH]: 'Ho Chi Minh',
  [LOCATION_SLUGS.HANOI]: 'Hanoi',
  [LOCATION_SLUGS.BARCELONA]: 'Barcelona',
  [LOCATION_SLUGS.MEXICO_CITY]: 'Mexico City',
  [LOCATION_SLUGS.MEDELLIN]: 'Medellín',
};

/**
 * Default images for locations
 *
 * TODO: DATABASE MIGRATION
 * Location images should be stored in a CDN/cloud storage and referenced from the database.
 * Each location should support multiple images (hero, thumbnail, gallery).
 * Image URLs should be returned by the API endpoint.
 */
export const LOCATION_IMAGES: Record<string, string> = {
  [LOCATION_SLUGS.BALI]: '/images/demo/locations/bali.jpg',
  [LOCATION_SLUGS.SIARGAO]: '/images/demo/locations/siargao.jpg',
  [LOCATION_SLUGS.CHIANG_MAI]: '/images/demo/locations/chiang-mai.jpg',
  [LOCATION_SLUGS.LISBON]: '/images/demo/locations/lisbon.jpg',
  [LOCATION_SLUGS.BANGKOK]: '/images/demo/locations/bangkok.jpg',
  [LOCATION_SLUGS.HO_CHI_MINH]: '/images/demo/locations/ho-chi-minh.jpg',
  [LOCATION_SLUGS.LOMBOK]: '/images/demo/locations/lombok.jpg',
};
