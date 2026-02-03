/**
 * Category definitions - Single source of truth matching backend Cafe.Category enum.
 *
 * Categories:
 * - cafe: Regular cafes
 * - coworking: Coworking spaces
 * - restaurant: Restaurants with workspace
 * - hotel_cafe: Hotel lobby cafes
 * - library: Library cafes
 * - other: Other types
 */

// Backend category values - MUST match backend Cafe.Category enum
export const Category = {
  CAFE: 'cafe',
  COWORKING: 'coworking',
  RESTAURANT: 'restaurant',
  HOTEL_CAFE: 'hotel_cafe',
  LIBRARY: 'library',
  OTHER: 'other',
} as const;

export type CategoryValue = typeof Category[keyof typeof Category];

// All category values as array (for filtering, dropdowns, etc.)
export const ALL_CATEGORIES: CategoryValue[] = [
  Category.CAFE,
  Category.COWORKING,
  Category.RESTAURANT,
  Category.HOTEL_CAFE,
  Category.LIBRARY,
  Category.OTHER,
];

// Category colors - MUST match backend Cafe.CATEGORY_COLORS
export const CATEGORY_COLORS: Record<CategoryValue, string> = {
  [Category.CAFE]: '#22C55E',        // Green
  [Category.COWORKING]: '#3B82F6',   // Blue
  [Category.RESTAURANT]: '#EF4444',  // Red
  [Category.HOTEL_CAFE]: '#8B5CF6',  // Purple
  [Category.LIBRARY]: '#F59E0B',     // Amber
  [Category.OTHER]: '#6B7280',       // Gray
};

// i18n translation keys for categories
export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  [Category.CAFE]: 'categories.cafe',
  [Category.COWORKING]: 'categories.coworking',
  [Category.RESTAURANT]: 'categories.restaurant',
  [Category.HOTEL_CAFE]: 'categories.hotelCafe',
  [Category.LIBRARY]: 'categories.library',
  [Category.OTHER]: 'categories.other',
};

// Default labels (fallback when translation is missing)
export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  [Category.CAFE]: 'Cafe',
  [Category.COWORKING]: 'Coworking',
  [Category.RESTAURANT]: 'Restaurant',
  [Category.HOTEL_CAFE]: 'Hotel Cafe',
  [Category.LIBRARY]: 'Library',
  [Category.OTHER]: 'Other',
};

/**
 * Get translation key for a category
 */
export function getCategoryTranslationKey(category: string): string {
  return CATEGORY_TRANSLATION_KEYS[category] || 'categories.other';
}

/**
 * Get color for a category
 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as CategoryValue] || CATEGORY_COLORS[Category.OTHER];
}

/**
 * Get display label for a category (fallback when translation unavailable)
 */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as CategoryValue] || 'Other';
}

/**
 * Check if a value is a valid category
 */
export function isValidCategory(value: string): value is CategoryValue {
  return ALL_CATEGORIES.includes(value as CategoryValue);
}

// Legacy exports for backward compatibility
export const BACKEND_CATEGORIES = Category;
export const CAFE_CATEGORIES = CATEGORY_LABELS;
export type CafeCategory = CategoryValue;
export function normalizeCategory(category: string): string {
  return getCategoryLabel(category);
}
