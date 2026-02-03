/**
 * Review types for Nomad Cafes.
 *
 * IMPORTANT: There are two distinct types of reviews in this system:
 *
 * 1. CAFE REVIEWS (CafeReview):
 *    - Written by users/customers about specific cafés
 *    - Appear on individual café detail pages
 *    - Include detailed ratings for WiFi, power, noise, coffee (nomad-specific)
 *    - Can include photos
 *
 * 2. TESTIMONIALS (Testimonial):
 *    - Written by café owners/partners who work with Nomad Cafes
 *    - Appear on the home page testimonials section
 *    - Focus on the value of the Nomad Cafes platform itself
 *    - Include business metrics and results
 *
 * These are completely separate entities and should be stored/managed
 * separately in the backend.
 *
 * NOTE: The canonical CafeReview type is defined in types/cafe.ts.
 * This file contains extended types for documentation purposes.
 */

/**
 * Extended review type with additional fields for admin/moderation.
 * The primary CafeReview type is in types/cafe.ts.
 *
 * API Endpoints:
 * - GET /api/cafes/:id/reviews/ - List reviews for a cafe
 * - POST /api/cafes/:id/reviews/ - Create a new review (auth required)
 */
export type CafeReviewExtended = {
  id: string;
  cafeId: string; // Which café this review is for
  authorId: string; // User ID who wrote the review
  authorName: string;
  authorAvatarUrl?: string;
  createdAt: string; // ISO-8601 timestamp
  updatedAt?: string; // ISO-8601 timestamp

  // Ratings (1-5 scale) - Nomad-specific categories
  ratingOverall: number;
  ratingWifi: number | null; // WiFi quality
  ratingPower: number | null; // Power outlet availability
  ratingNoise: number | null; // Quietness (higher = quieter)
  ratingCoffee: number | null; // Coffee quality

  // Content
  text: string;
  photos?: string[]; // URLs to uploaded photos

  // Moderation
  isApproved?: boolean; // For admin moderation
  isReported?: boolean;
};

/**
 * Testimonial from a café owner/partner about the Nomad Cafes platform.
 * Used on the home page testimonials section.
 *
 * Note: Testimonials are currently managed via Django admin.
 * Future: Implement public API endpoints if needed.
 */
export type Testimonial = {
  id: string;
  cafeId?: string; // Optional: link to their café

  // Author (café owner/partner)
  authorName: string;
  authorRole: string; // e.g., "Owner", "Marketing Director"
  authorCompany?: string; // e.g., "The Palmas Hotel", "Google"
  authorAvatarUrl?: string;

  // Metrics/Results
  metric: string; // e.g., "3X", "500+", "2X"
  metricLabel: string; // e.g., "Increase in productivity", "Hours saved"

  // Content
  quote: string; // The testimonial text

  // Display settings
  variant?: 'light' | 'dark'; // For card styling
  displayOrder?: number; // For controlling order on homepage
  isActive: boolean; // Whether to show this testimonial

  // Timestamps
  createdAt: string; // ISO-8601 timestamp
  updatedAt?: string; // ISO-8601 timestamp
};

/**
 * Review summary for a café (aggregated stats).
 * Auto-calculated from cafe reviews via Django signals.
 */
export type ReviewSummary = {
  overall: number;
  wifi: number;
  power: number;
  noise: number;
  coffee: number;
  totalCount: number; // Total number of reviews
};

/**
 * Constants for review ratings
 */
export const REVIEW_RATING = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3,
} as const;

/**
 * Review filter/sort options for future implementation
 */
export type ReviewFilters = {
  minRating?: number;
  maxRating?: number;
  sortBy?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated';
  limit?: number;
  offset?: number;
};
