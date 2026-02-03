import type { TFunction } from 'i18next';
import type { DropdownOption } from '@/lib/constants/exploreFilters';
import { Category } from '@/lib/constants/categories';
import { Feature, TOP_FEATURES } from '@/lib/constants/features';

/**
 * Returns translated category filter options
 * Note: Values must match backend Cafe.Category enum
 */
export const getCategoryOptions = (t: TFunction): DropdownOption[] => [
  { value: 'all', label: t('filters.categories.all') },
  { value: Category.CAFE, label: t('filters.categories.cafe') },
  { value: Category.COWORKING, label: t('filters.categories.coworking') },
  { value: Category.RESTAURANT, label: t('filters.categories.restaurant') },
  { value: Category.HOTEL_CAFE, label: t('filters.categories.hotelCafe') },
  { value: Category.LIBRARY, label: t('filters.categories.library') },
  { value: Category.OTHER, label: t('filters.categories.other') },
];

/**
 * Returns translated price range filter options
 */
export const getPriceRangeOptions = (t: TFunction): DropdownOption[] => [
  { value: 'any', label: t('filters.price.any') },
  { value: 'budget', label: t('filters.price.budget') },
  { value: 'mid', label: t('filters.price.moderate') },
  { value: 'premium', label: t('filters.price.expensive') + ' – ' + t('filters.price.luxury') },
];

/**
 * Returns translated feature filter options
 * Note: Values must match backend Cafe.Feature enum
 */
export const getFeatureOptions = (t: TFunction): DropdownOption[] => [
  { value: 'any', label: t('filters.features.any') },
  { value: Feature.FAST_WIFI, label: t('filters.features.fastWifi') },
  { value: Feature.POWER_OUTLETS, label: t('filters.features.powerOutlets') },
  { value: Feature.QUIET, label: t('filters.features.quiet') },
  { value: Feature.OUTDOOR_SEATING, label: t('filters.features.outdoorSeating') },
  { value: Feature.PET_FRIENDLY, label: t('filters.features.petFriendly') },
  { value: Feature.OPEN_LATE, label: t('filters.features.openLate') },
];

// Legacy alias for backward compatibility
export const getTagOptions = getFeatureOptions;

/**
 * Returns translated sort filter options
 */
export const getSortOptions = (t: TFunction): DropdownOption[] => [
  { value: 'default', label: t('filters.sort.default') },
  { value: 'rating', label: t('filters.sort.rating') },
  { value: 'price_low', label: t('filters.sort.priceLow') },
  { value: 'price_high', label: t('filters.sort.priceHigh') },
];
