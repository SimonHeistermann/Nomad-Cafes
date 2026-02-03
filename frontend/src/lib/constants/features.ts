/**
 * Feature definitions - Single source of truth matching backend Cafe.Feature enum.
 *
 * Features are stored in the backend as cafe.tags (JSON array).
 * This file defines valid feature values and their display/translation mappings.
 */

// Top 6 filterable features - used in filter dropdowns
export const Feature = {
  // Top features (for filtering)
  FAST_WIFI: 'fast_wifi',
  POWER_OUTLETS: 'power_outlets',
  QUIET: 'quiet',
  OUTDOOR_SEATING: 'outdoor_seating',
  PET_FRIENDLY: 'pet_friendly',
  OPEN_LATE: 'open_late',

  // Additional features
  AIR_CONDITIONING: 'air_conditioning',
  GREAT_COFFEE: 'great_coffee',
  FOOD_AVAILABLE: 'food_available',
  VEGAN_OPTIONS: 'vegan_options',
  MEETING_FRIENDLY: 'meeting_friendly',
  GOOD_LIGHTING: 'good_lighting',
  ACCESSIBLE: 'accessible',
  PARKING: 'parking',
  BIKE_PARKING: 'bike_parking',
  SMOKE_FREE: 'smoke_free',
  STANDING_DESKS: 'standing_desks',
  ACCEPTS_CARDS: 'accepts_cards',
  RESERVATIONS: 'reservations',
  ALCOHOL: 'alcohol',
} as const;

export type FeatureValue = typeof Feature[keyof typeof Feature];

// Top features for filter dropdowns
export const TOP_FEATURES: FeatureValue[] = [
  Feature.FAST_WIFI,
  Feature.POWER_OUTLETS,
  Feature.QUIET,
  Feature.OUTDOOR_SEATING,
  Feature.PET_FRIENDLY,
  Feature.OPEN_LATE,
];

// All features
export const ALL_FEATURES: FeatureValue[] = Object.values(Feature);

// Feature translation keys - maps feature values to i18n keys
// Note: translations are under "amenities" namespace, not "features"
// ("features" namespace contains homepage section with nested objects)
export const FEATURE_TRANSLATION_KEYS: Record<string, string> = {
  // Top features
  [Feature.FAST_WIFI]: 'amenities.fastWifi',
  [Feature.POWER_OUTLETS]: 'amenities.powerOutlets',
  [Feature.QUIET]: 'amenities.quiet',
  [Feature.OUTDOOR_SEATING]: 'amenities.outdoorSeating',
  [Feature.PET_FRIENDLY]: 'amenities.petFriendly',
  [Feature.OPEN_LATE]: 'amenities.openLate',

  // Additional features
  [Feature.AIR_CONDITIONING]: 'amenities.airConditioning',
  [Feature.GREAT_COFFEE]: 'amenities.greatCoffee',
  [Feature.FOOD_AVAILABLE]: 'amenities.foodAvailable',
  [Feature.VEGAN_OPTIONS]: 'amenities.veganOptions',
  [Feature.MEETING_FRIENDLY]: 'amenities.meetingFriendly',
  [Feature.GOOD_LIGHTING]: 'amenities.goodLighting',
  [Feature.ACCESSIBLE]: 'amenities.accessible',
  [Feature.PARKING]: 'amenities.parking',
  [Feature.BIKE_PARKING]: 'amenities.bikeParking',
  [Feature.SMOKE_FREE]: 'amenities.smokeFree',
  [Feature.STANDING_DESKS]: 'amenities.standingDesks',
  [Feature.ACCEPTS_CARDS]: 'amenities.acceptsCards',
  [Feature.RESERVATIONS]: 'amenities.reservations',
  [Feature.ALCOHOL]: 'amenities.alcohol',
};

// Default labels (fallback when translation is missing)
export const FEATURE_LABELS: Record<FeatureValue, string> = {
  [Feature.FAST_WIFI]: 'Fast WiFi',
  [Feature.POWER_OUTLETS]: 'Power Outlets',
  [Feature.QUIET]: 'Quiet',
  [Feature.OUTDOOR_SEATING]: 'Outdoor Seating',
  [Feature.PET_FRIENDLY]: 'Pet Friendly',
  [Feature.OPEN_LATE]: 'Open Late',
  [Feature.AIR_CONDITIONING]: 'Air Conditioning',
  [Feature.GREAT_COFFEE]: 'Great Coffee',
  [Feature.FOOD_AVAILABLE]: 'Food Available',
  [Feature.VEGAN_OPTIONS]: 'Vegan Options',
  [Feature.MEETING_FRIENDLY]: 'Meeting Friendly',
  [Feature.GOOD_LIGHTING]: 'Good Lighting',
  [Feature.ACCESSIBLE]: 'Accessible',
  [Feature.PARKING]: 'Parking',
  [Feature.BIKE_PARKING]: 'Bike Parking',
  [Feature.SMOKE_FREE]: 'Smoke Free',
  [Feature.STANDING_DESKS]: 'Standing Desks',
  [Feature.ACCEPTS_CARDS]: 'Accepts Cards',
  [Feature.RESERVATIONS]: 'Reservations',
  [Feature.ALCOHOL]: 'Serves Alcohol',
};

/**
 * Get translation key for a feature
 */
export function getFeatureTranslationKey(feature: string): string {
  return FEATURE_TRANSLATION_KEYS[feature] || `amenities.${feature}`;
}

/**
 * Get display label for a feature (fallback when translation unavailable)
 */
export function getFeatureDisplayLabel(feature: string): string {
  if (FEATURE_LABELS[feature as FeatureValue]) {
    return FEATURE_LABELS[feature as FeatureValue];
  }
  // Convert snake_case to Title Case
  return feature
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Check if a value is a valid feature
 */
export function isValidFeature(value: string): value is FeatureValue {
  return ALL_FEATURES.includes(value as FeatureValue);
}

/**
 * Check if a feature is a top filterable feature
 */
export function isTopFeature(value: string): boolean {
  return TOP_FEATURES.includes(value as FeatureValue);
}

// Legacy exports for backward compatibility
export const CANONICAL_TAGS = TOP_FEATURES;
export type CanonicalTag = FeatureValue;
export function isCanonicalTag(tag: string): tag is FeatureValue {
  return isTopFeature(tag);
}
