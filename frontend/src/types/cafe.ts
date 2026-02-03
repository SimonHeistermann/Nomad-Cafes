export type OpeningHoursEntry = {
    day: string;
    open: string;
    close: string;
    isClosed?: boolean;
  };
  
  // TODO: In production database, store FAQs with language codes
  // and retrieve based on user's selected language
  export type FaqItem = {
    id: string;
    question: {
      en: string;
      de: string;
    };
    answer: {
      en: string;
      de: string;
    };
  };
  
  export type CafeReview = {
    id: string;
    authorName: string;
    authorAvatarUrl?: string;
    createdAt: string; // ISO-String oder lesbarer Text
    ratingOverall: number;
    ratingWifi: number | null;
    ratingPower: number | null;
    ratingNoise: number | null; // Higher = quieter
    ratingCoffee: number | null;
    text: string;
    language?: string; // Language code of the review (e.g., 'en', 'de', 'es')
    photos?: string[];
  };

  // User's own review with cafe info
  export type UserReview = {
    id: string;
    cafeId: string;
    cafeName: string;
    cafeSlug: string;
    cafeThumbnail?: string;
    cafeCity: string;
    ratingOverall: number;
    ratingWifi: number | null;
    ratingPower: number | null;
    ratingNoise: number | null; // Higher = quieter
    ratingCoffee: number | null;
    text: string;
    language?: string;
    photos?: string[];
    createdAt: string;
    updatedAt: string;
  };
  
  export type Cafe = {
    id: string;
    slug?: string;
    name: string;
    // TODO: In production database, store description with language codes
    description: {
      en: string;
      de: string;
    } | string; // kurze Card-Beschreibung
    imageUrl: string;
    priceLevel: number;
    isOpen: boolean;
    isFeatured: boolean;
    rating: number;
    reviewCount: number;
    phone: string;
    city: string;

    /** IANA timezone (e.g., "Asia/Makassar" for Bali) */
    timeZone?: string;
  
    category: string;
    categoryColor: string;
    isFavorite: boolean;
  
    // === Detail-spezifische Felder (alle optional) ===
    // TODO: In production database, store overview with language codes
    overview?: {
      en: string;
      de: string;
    };
    addressLine1?: string;
    addressLine2?: string;
    latitude?: number;
    longitude?: number;
  
    websiteUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string; // X (formerly Twitter)
    tiktokUrl?: string;
  
    priceRangeLabel?: string; // z.B. "$ 5–10 / drink"
    ownerName?: string;
    ownerRole?: string;
  
    galleryImages?: string[];
    logoUrl?: string; // Brand logo/badge image
    features?: string[]; // Feature keys, e.g. ["fast_wifi", "outdoor_seating"]
    faqs?: FaqItem[];
    openingHours?: OpeningHoursEntry[];
    reviewsSummary?: {
      overall: number;
      wifi: number;
      power: number;
      noise: number;
      coffee: number;
    };
    reviews?: CafeReview[];

    /** Whether the business wants to display a contact form. TODO: Replace mock with DB field */
    allowsContact?: boolean;
};  