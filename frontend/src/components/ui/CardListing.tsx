import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion as MOTION } from 'framer-motion';
import { FaLocationDot, FaPhone, FaHeart } from 'react-icons/fa6';
import { FiHeart, FiZap } from 'react-icons/fi';
import '@/styles/components/ui/card-listing.css';

import type { Cafe } from '@/types/cafe';
import { getOpenStateForNow } from '@/lib/utils/opening-hours';
import { getPriceLabelForLocale } from '@/lib/utils/pricing';
import { getCategoryTranslationKey } from '@/lib/constants/categories';
import { useAuth, useAuthCta, useFavorites } from '@/contexts';

type CardListingProps = {
  cafe: Cafe;
  onClick?: (cafe: Cafe) => void;
};

const CardListing: React.FC<CardListingProps> = ({ cafe, onClick }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { openAuthCta } = useAuthCta();
  const { isFavorite, toggleFavorite } = useFavorites();
  const {
    id,
    name,
    description,
    imageUrl,
    priceLevel,
    isOpen,
    isFeatured,
    rating,
    reviewCount,
    phone,
    city,
    category,
    categoryColor,
    openingHours,
    timeZone,
    logoUrl,
  } = cafe;

  const navigate = useNavigate();
  const favorite = isFavorite(id);

  const priceLabel = getPriceLabelForLocale(priceLevel || 1, i18n.language);

  // 🔥 Einheitliche Open/Closed-Logik (Timezones + OpeningHours)
  const { isOpenNow } = getOpenStateForNow(
    openingHours ?? [],
    isOpen,
    timeZone,
  );

  const openLabel = isOpenNow ? t('cafeCard.open') : t('cafeCard.closed');

  // Get description based on current language (handle undefined/null)
  const locale = i18n.language as 'en' | 'de';
  const descriptionText = !description
    ? ''
    : typeof description === 'string'
      ? description
      : (description[locale] || description.en || '');

  // Translate category (with fallback for undefined)
  const safeCategory = category || 'other';
  const categoryTranslationKey = getCategoryTranslationKey(safeCategory);
  const translatedCategory = t(categoryTranslationKey);

  const roundedRating = Math.round(rating || 0);
  const filledStars = '★'.repeat(roundedRating);
  const emptyStars = '☆'.repeat(Math.max(0, 5 - roundedRating));

  const normalizedPhone = (phone ?? '').replace(/\s+/g, '');

  const handleCardClick = () => {
    if (typeof onClick === 'function') {
      onClick(cafe);
    } else {
      // Use slug for URL if available, fallback to id
      const identifier = cafe.slug || id;
      navigate(`/listing/${identifier}`);
    }
  };

  const handleFavoriteClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    // Auth check: backend enforces permission, frontend provides UX guard
    if (!isAuthenticated) {
      openAuthCta('favorite');
      return;
    }

    toggleFavorite(id);
  };

  const handlePhoneClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <MOTION.article
      className="listing-card"
      onClick={handleCardClick}
      whileHover={{
        y: -8,
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Bild + Overlays */}
      <div className="listing-card-media">
        <img src={imageUrl} alt={name} />

        {/* Top chips */}
        <div className="listing-card-chips">
          <div className="listing-card-chips-left">
            <span className="listing-chip listing-chip--soft">
              {priceLabel}
            </span>
            <span
              className={`listing-chip ${
                isOpenNow
                  ? 'listing-chip--success'
                  : 'listing-chip--muted'
              }`}
            >
              {openLabel}
            </span>
          </div>

          {isFeatured && (
            <span className="listing-chip listing-chip--featured">
              {t('cafeCard.featured')}
            </span>
          )}
        </div>

        {/* Rating unten links */}
        <div className="listing-card-rating">
          <span className="listing-card-stars">
            {filledStars}
            {emptyStars}
          </span>
          <span className="listing-card-reviews">
            ({reviewCount} {reviewCount === 1 ? t('cafeCard.review') : t('cafeCard.reviews')})
          </span>
        </div>

        {/* Logo/Icon Badge unten rechts */}
        <div className="listing-card-badge">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="listing-card-badge-image"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('listing-card-badge-icon--hidden');
              }}
            />
          ) : null}
          <FiZap
            className={`listing-card-badge-icon ${logoUrl ? 'listing-card-badge-icon--hidden' : ''}`}
          />
        </div>
      </div>

      {/* Inhalt */}
      <div className="listing-card-body">
        <h3 className="listing-card-title">{name}</h3>
        <p className="listing-card-text">{descriptionText}</p>

        <div className="listing-card-meta">
          <a
            href={normalizedPhone ? `tel:${normalizedPhone}` : undefined}
            className="listing-card-meta-item listing-card-meta-link"
            onClick={handlePhoneClick}
          >
            <FaPhone className="listing-card-meta-icon" />
            <span>{phone}</span>
          </a>

          <div className="listing-card-meta-item">
            <FaLocationDot className="listing-card-meta-icon" />
            <span>{city}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="listing-card-footer">
        <div
          className="listing-card-category-pill"
          style={{ '--category-color': categoryColor } as React.CSSProperties}
        >
          <span className="listing-card-category-dot" />
          <span className="listing-card-category-label">
            {translatedCategory}
          </span>
        </div>

        {/* ❤️ Bounce Animation */}
        <MOTION.button
          type="button"
          className="listing-card-favorite"
          aria-label={
            favorite ? t('cafeCard.removeFromFavorites') : t('cafeCard.addToFavorites')
          }
          aria-pressed={favorite}
          onClick={handleFavoriteClick}
          whileTap={{ scale: 0.8 }}
          animate={{ scale: favorite ? 1.2 : 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 12,
          }}
        >
          {favorite ? (
            <FaHeart className="listing-card-favorite-icon listing-card-favorite-icon--active" />
          ) : (
            <FiHeart className="listing-card-favorite-icon" />
          )}
        </MOTION.button>
      </div>
    </MOTION.article>
  );
};

export default CardListing;