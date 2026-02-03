// TODO: DATABASE I18N
// These filter options contain hardcoded values that should come from the database.
// When implementing the database:
// 1. Create a filter_options table with columns:
//    - id (PK)
//    - filter_type ('category', 'tag', etc.)
//    - value (the filter value used in queries)
//    - sort_order (for display ordering)
// 2. Create a filter_translations table with columns:
//    - filter_option_id (FK)
//    - language_code ('en', 'de', etc.)
//    - label (translated display text)
// 3. Categories and tags should be dynamic and manageable via admin interface
// 4. Load filter options via API endpoint that returns translated labels
// 5. Cache filter options in application state to avoid repeated queries
// NOTE: Price range and sort options can remain hardcoded as they're universal

export type DropdownOption = {
    value: string;
    label: string;
};

export const CATEGORY_OPTIONS: DropdownOption[] = [
    { value: 'all', label: 'All categories' },
    { value: 'Outdoor café', label: 'Outdoor cafés' },
    { value: 'Museum café', label: 'Museum cafés' },
    { value: 'Hotel café', label: 'Hotel cafés' },
    { value: 'Restaurant', label: 'Restaurants' },
    { value: 'Fitness café', label: 'Fitness cafés' },
];
  
export const PRICE_RANGE_OPTIONS: DropdownOption[] = [
    { value: 'any', label: 'Any price' },
    { value: '1-2', label: '$ – $$' },
    { value: '3-4', label: '$$$ – $$$$' },
];
  
export const TAG_OPTIONS: DropdownOption[] = [
    { value: 'any', label: 'All tags' },
    { value: 'wifi', label: 'Fast WiFi' },
    { value: 'outdoor', label: 'Outdoor seating' },
    { value: 'late', label: 'Open late' },
];
  
export const SORT_OPTIONS: DropdownOption[] = [
    { value: 'default', label: 'Default' },
    { value: 'rating_desc', label: 'Rating (high–low)' },
    { value: 'price_asc', label: 'Price (low–high)' },
    { value: 'price_desc', label: 'Price (high–low)' },
];
  