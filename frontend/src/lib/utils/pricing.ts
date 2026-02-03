/**
 * Get price label with currency symbol based on locale
 *
 * @param priceLevel - Price level (1-4)
 * @param locale - Locale code ('en', 'de', etc.)
 * @returns Price label string (e.g., '€€', '$$$')
 */
export function getPriceLabelForLocale(
  priceLevel: number,
  locale: string,
): string {
  const level = Math.max(1, Math.min(4, priceLevel || 1));

  // Use Euro for German locale
  if (locale === 'de') {
    return '€'.repeat(level);
  }

  // Default to Dollar for other locales
  return '$'.repeat(level);
}

/**
 * Format price range label with currency based on locale
 *
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param unit - Price unit (e.g., 'drink', 'meal')
 * @param locale - Locale code
 * @param t - Translation function
 * @returns Formatted price range (e.g., '€ 5–10 / drink')
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  unit: string,
  locale: string,
  t: (key: string) => string,
): string {
  const currencySymbol = locale === 'de' ? '€' : '$';
  const translatedUnit = t(`pricing.${unit}`);

  return `${currencySymbol} ${minPrice}–${maxPrice} / ${translatedUnit}`;
}

/**
 * Translate price range label from English to target locale
 * Handles labels like "$ 4–8 / drink" → "€ 4–8 / Getränk"
 *
 * @param priceRangeLabel - Price range label in English (e.g., "$ 4–8 / drink")
 * @param locale - Target locale
 * @param t - Translation function
 * @returns Translated price range label
 */
export function translatePriceRangeLabel(
  priceRangeLabel: string,
  locale: string,
  t: (key: string) => string,
): string {
  if (!priceRangeLabel) return priceRangeLabel;

  let result = priceRangeLabel;

  // Replace currency symbol
  if (locale === 'de') {
    result = result.replace(/\$/g, '€');
  }

  // Replace units with translations
  const unitMappings: Record<string, string> = {
    'drink': t('pricing.drink'),
    'smoothie': t('pricing.smoothie'),
    'coffee & snack': t('pricing.coffeeSnack'),
    'meal': t('pricing.meal'),
  };

  for (const [english, translated] of Object.entries(unitMappings)) {
    result = result.replace(new RegExp(english, 'gi'), translated);
  }

  return result;
}
