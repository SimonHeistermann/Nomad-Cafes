import React from 'react';
import {
  FaPhone,
  FaLocationDot,
  FaStar,
  FaHeart,
  FaRegHeart,
} from 'react-icons/fa6';
import { FiShare2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import type { OpeningHoursEntry } from '@/types/cafe';
import { getOpenStateForNow } from '@/lib/utils/opening-hours';
import { useAuth, useAuthCta } from '@/contexts';

export type ListingHeaderProps = {
  name: string;
  city: string;
  phone: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  isOpen: boolean;
  description: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  openingHours?: OpeningHoursEntry[];
  timeZone?: string;
  logoUrl?: string;
};

export const ListingHeader: React.FC<ListingHeaderProps> = ({
  name,
  city,
  phone,
  rating,
  reviewCount,
  priceLabel,
  isOpen,
  description,
  isFavorite,
  onToggleFavorite,
  openingHours = [],
  timeZone,
  logoUrl,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { openAuthCta } = useAuthCta();
  const normalizedPhone = (phone ?? '').replace(/\s+/g, '');

  const { isOpenNow, opensAt } = getOpenStateForNow(
    openingHours,
    isOpen,
    timeZone,
  );

  // Header-Label: entweder "Now open" oder "Opens at HH:MM"
  const openLabel = isOpenNow
    ? t('cafeDetail.nowOpen')
    : opensAt
      ? t('cafeDetail.opensAt', { time: opensAt })
      : t('cafeCard.closed');

  const handleScrollToReviews = () => {
    const el = document.getElementById('listing-detail-reviews');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToAddReview = () => {
    // Auth check: backend enforces permission, frontend provides UX guard
    if (!isAuthenticated) {
      openAuthCta('review');
      return;
    }

    const el = document.getElementById('listing-detail-add-review');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFavoriteClick = () => {
    // Auth check: backend enforces permission, frontend provides UX guard
    if (!isAuthenticated) {
      openAuthCta('favorite');
      return;
    }

    onToggleFavorite();
  };

  return (
    <header className="listing-detail-header">
      <div className="listing-detail-header-main">
        <div className="listing-detail-avatar">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="listing-detail-avatar-image"
              onError={(e) => {
                // Fallback to initial if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) fallback.classList.remove('listing-detail-avatar-initial--hidden');
              }}
            />
          ) : null}
          <span className={logoUrl ? 'listing-detail-avatar-initial--hidden' : ''}>
            {name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="listing-detail-header-text">
          <h1 className="listing-detail-title">{name}</h1>

          <div className="listing-detail-meta-row">
            <a
              href={normalizedPhone ? `tel:${normalizedPhone}` : undefined}
              className="listing-detail-meta-item"
            >
              <FaPhone />
              <span>{phone}</span>
            </a>

            <div className="listing-detail-meta-item">
              <FaLocationDot />
              <span>{city}</span>
            </div>

            <div
              className="listing-detail-meta-item listing-detail-meta-item--interactive"
              onClick={handleScrollToReviews}
            >
              <FaStar className="listing-detail-meta-star" />
              <span>
                {rating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? t('cafeCard.review') : t('cafeCard.reviews')})
              </span>
            </div>

            <div className="listing-detail-meta-item listing-detail-meta-price">
              <span>{priceLabel}</span>
            </div>

            <div
              className={
                'listing-detail-meta-item listing-hours-badge ' +
                (isOpenNow ? 'listing-hours-badge--open' : '')
              }
            >
              {openLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="listing-detail-header-actions">
        <button
          type="button"
          className="btn-secondary listing-detail-header-btn"
          onClick={() => {
            if (navigator.share) {
              navigator
                .share({
                  title: name,
                  text: description,
                  url: window.location.href,
                })
                .catch(() => undefined);
            }
          }}
        >
          <FiShare2 />
          <span>{t('cafeDetail.share')}</span>
        </button>

        <button
          type="button"
          className="btn-secondary listing-detail-header-btn"
          onClick={handleFavoriteClick}
        >
          {isFavorite ? <FaHeart /> : <FaRegHeart />}
          <span>{isFavorite ? t('cafeDetail.saved') : t('cafeDetail.save')}</span>
        </button>

        <button
          type="button"
          className="btn-primary listing-detail-header-btn listing-detail-header-btn--primary"
          onClick={handleScrollToAddReview}
        >
          {t('cafeDetail.submitReview')}
        </button>
      </div>
    </header>
  );
};