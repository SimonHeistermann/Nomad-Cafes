import type { Cafe } from '@/types/cafe';
import type { TrendingLocation } from '@/types/location';
import { LOCATION_SLUGS, LOCATION_LABELS, LOCATION_IMAGES } from '@/lib/constants/locations';

export type LocationOption = {
  value: string;
  label: string;
};

/**
 * Get the i18n translation key for a location slug.
 * Use this with t() in components to get the translated location name.
 *
 * @param locationSlug - The location slug (e.g., "bali", "chiang-mai")
 * @returns The translation key (e.g., "locations.bali")
 */
export function getLocationTranslationKey(locationSlug: string): string {
  return `locations.${locationSlug}`;
}

/**
 * The "All locations" option for location dropdowns.
 * Note: The label is in English - use t('locations.any') in components for translated version.
 * @deprecated Use createAllLocationsOption(t) instead for i18n support
 */
export const ALL_LOCATIONS_OPTION: LocationOption = {
  value: 'any',
  label: 'All locations',
};

/**
 * Extract the location slug from a cafe's city field.
 * Examples:
 * - "Canggu, Bali" -> "bali"
 * - "Siargao City, Siargao" -> "siargao"
 * - "Chiang Mai, Thailand" -> "chiang-mai"
 * - "Senggigi, Lombok" -> "lombok"
 */
export function getCafeLocation(cafe: Cafe): string {
  const city = cafe.city.toLowerCase();

  if (city.includes('bali')) return LOCATION_SLUGS.BALI;
  if (city.includes('lombok')) return LOCATION_SLUGS.LOMBOK;
  if (city.includes('siargao')) return LOCATION_SLUGS.SIARGAO;
  if (city.includes('chiang mai')) return LOCATION_SLUGS.CHIANG_MAI;
  if (city.includes('lisbon')) return LOCATION_SLUGS.LISBON;
  if (city.includes('bangkok')) return LOCATION_SLUGS.BANGKOK;
  if (city.includes('ho chi minh') || city.includes('saigon')) return LOCATION_SLUGS.HO_CHI_MINH;
  if (city.includes('hanoi')) return LOCATION_SLUGS.HANOI;
  if (city.includes('barcelona')) return LOCATION_SLUGS.BARCELONA;
  if (city.includes('mexico city')) return LOCATION_SLUGS.MEXICO_CITY;
  if (city.includes('medellin')) return LOCATION_SLUGS.MEDELLIN;

  // Fallback: use first part before comma, kebab-cased
  const parts = cafe.city.split(',');
  return parts[0].trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get the display label for a location slug.
 */
export function getLocationLabel(locationSlug: string): string {
  return LOCATION_LABELS[locationSlug] || locationSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract unique locations from cafes with their cafe counts.
 * Returns locations sorted by cafe count (descending).
 * Note: Labels are in English. Use getUniqueLocationsi18n() for translated labels.
 */
export function getUniqueLocations(cafes: Cafe[]): LocationOption[] {
  const locationCounts = new Map<string, number>();

  cafes.forEach(cafe => {
    const location = getCafeLocation(cafe);
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  return Array.from(locationCounts.entries())
    .map(([value, count]) => ({
      value,
      label: getLocationLabel(value),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .map(({ value, label }) => ({ value, label }));
}

/**
 * Extract unique locations from cafes with i18n support.
 * Returns locations sorted by cafe count (descending) with translated labels.
 *
 * @param cafes - Array of cafes
 * @param t - Translation function from useTranslation hook
 * @returns Array of location options with translated labels
 */
export function getUniqueLocationsi18n(
  cafes: Cafe[],
  t: (key: string) => string
): LocationOption[] {
  const locationCounts = new Map<string, number>();

  cafes.forEach(cafe => {
    const location = getCafeLocation(cafe);
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  return Array.from(locationCounts.entries())
    .map(([value, count]) => ({
      value,
      label: t(getLocationTranslationKey(value)),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .map(({ value, label }) => ({ value, label }));
}

/**
 * Get top N locations by cafe count.
 * Returns an array of location labels in English.
 * Note: Use getTopLocationsi18n() for translated labels.
 */
export function getTopLocations(cafes: Cafe[], count: number): string[] {
  const locationCounts = new Map<string, number>();

  cafes.forEach(cafe => {
    const location = getCafeLocation(cafe);
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  return Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([location]) => getLocationLabel(location));
}

/**
 * Get top N locations by cafe count with i18n support.
 * Returns an array of translated location labels.
 *
 * @param cafes - Array of cafes
 * @param count - Number of top locations to return
 * @param t - Translation function from useTranslation hook
 * @returns Array of translated location labels
 */
export function getTopLocationsi18n(
  cafes: Cafe[],
  count: number,
  t: (key: string) => string
): string[] {
  const locationCounts = new Map<string, number>();

  cafes.forEach(cafe => {
    const location = getCafeLocation(cafe);
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  return Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([location]) => t(getLocationTranslationKey(location)));
}

/**
 * Get top N trending locations from cafes.
 * Returns TrendingLocation objects with cafe counts.
 * @deprecated Use useTrendingLocations hook from @/lib/hooks/useLocations instead
 */
export function getTrendingLocations(cafes: Cafe[], count: number = 4): TrendingLocation[] {
  // Count cafes for each location
  const locationCounts = new Map<string, number>();
  cafes.forEach(cafe => {
    const location = getCafeLocation(cafe);
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  // Get top locations by count
  const topSlugs = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([slug]) => slug);

  return topSlugs.map((locationSlug) => {
    const cafeCount = locationCounts.get(locationSlug) || 0;
    return {
      id: locationSlug,
      name: getLocationLabel(locationSlug),
      subtitle: `${cafeCount} location${cafeCount !== 1 ? 's' : ''}`,
      imageUrl: LOCATION_IMAGES[locationSlug] || '/images/demo/locations/default.jpg',
    };
  });
}

/**
 * Get top N trending locations from cafes with i18n support.
 * Returns TrendingLocation objects with translated names and pluralized location counts.
 * @deprecated Use useTrendingLocations hook from @/lib/hooks/useLocations instead
 */
export function getTrendingLocationsi18n(
  cafes: Cafe[],
  count: number = 4,
  t: (key: string, options?: { count?: number }) => string
): TrendingLocation[] {
  // Count cafes for each location
  const locationCounts = new Map<string, number>();
  cafes.forEach(cafe => {
    const location = getCafeLocation(cafe);
    locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
  });

  // Get top locations by count
  const topSlugs = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([slug]) => slug);

  return topSlugs.map((locationSlug) => {
    const cafeCount = locationCounts.get(locationSlug) || 0;
    return {
      id: locationSlug,
      name: t(getLocationTranslationKey(locationSlug)),
      subtitle: t('trendingLocations.locationCount', { count: cafeCount }),
      imageUrl: LOCATION_IMAGES[locationSlug] || '/images/demo/locations/default.jpg',
    };
  });
}
