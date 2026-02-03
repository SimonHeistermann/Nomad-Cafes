import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CafeReview } from '@/types/cafe';
import { translateText } from '@/lib/services/translation';

type ReviewsSummary = {
  overall: number;
  wifi: number;
  power: number;
  noise: number;
  coffee: number;
};

export type ReviewsSectionProps = {
  rating: number;
  reviewCount: number;
  reviewsSummary?: ReviewsSummary;
  reviews?: CafeReview[];
  /** wie viele Reviews sollen angezeigt werden? (z.B. 3) */
  limit?: number;
  /** wird gezeigt, wenn es mehr Reviews als `limit` gibt */
  onViewAllClick?: () => void;
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  rating,
  reviewCount,
  reviewsSummary,
  reviews = [],
  limit,
  onViewAllClick,
}) => {
  const { t, i18n } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  const handleTranslate = async (reviewId: string, text: string, sourceLang?: string) => {
    setTranslating((prev) => ({ ...prev, [reviewId]: true }));

    try {
      const result = await translateText(text, i18n.language, sourceLang);
      setTranslatedTexts((prev) => ({ ...prev, [reviewId]: result.translatedText }));
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setTranslating((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleShowOriginal = (reviewId: string) => {
    setTranslatedTexts((prev) => {
      const updated = { ...prev };
      delete updated[reviewId];
      return updated;
    });
  };

  const LABELS: { key: keyof ReviewsSummary; label: string }[] = [
    { key: 'overall', label: t('cafeDetail.reviewForm.overall') },
    { key: 'wifi', label: t('cafeDetail.reviewForm.wifi') },
    { key: 'power', label: t('cafeDetail.reviewForm.power') },
    { key: 'noise', label: t('cafeDetail.reviewForm.noise') },
    { key: 'coffee', label: t('cafeDetail.reviewForm.coffee') },
  ];
  if (!reviewsSummary && reviews.length === 0) {
    return null;
  }

  const visibleReviews =
    typeof limit === 'number' ? reviews.slice(0, limit) : reviews;

  return (
    <section
      className="listing-section listing-reviews-section"
      id="listing-detail-reviews"
    >
      {/* Summary */}
      <div className="listing-reviews-summary">
        <div className="listing-reviews-summary-header">
          <h2 className="listing-section-title">{t('cafeDetail.reviews')}</h2>
          <p className="listing-reviews-summary-score">
            {rating.toFixed(2)}{' '}
            <span className="listing-reviews-summary-count">
              ({reviewCount} {reviewCount === 1 ? t('cafeCard.review') : t('cafeCard.reviews')})
            </span>
          </p>
        </div>

        {reviewsSummary && (
          <div className="listing-reviews-summary-grid">
            {LABELS.map(({ key, label }) => {
              const value = reviewsSummary[key] ?? 0;
              const percentage = Math.max(
                0,
                Math.min(100, (value / 5) * 100),
              );

              return (
                <div
                  key={key}
                  className="listing-reviews-summary-item"
                >
                  <span className="listing-reviews-summary-label">
                    {label}
                  </span>
                  <div className="listing-reviews-summary-bar-wrapper">
                    <div className="listing-reviews-summary-bar">
                      <div
                        className="listing-reviews-summary-bar-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="listing-reviews-summary-value">
                      {value.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Einzelne Reviews (limitiert) */}
      {visibleReviews.length > 0 && (
        <div className="listing-reviews-list">
          {visibleReviews.map((review) => {
            const date = new Date(review.createdAt);
            const formattedDate = isNaN(date.getTime())
              ? review.createdAt
              : date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

            const rounded = Math.round(review.ratingOverall);
            const filledStars = '★'.repeat(rounded);
            const emptyStars = '☆'.repeat(5 - rounded);

            const initials = (review.authorName || '')
              .split(' ')
              .filter((part) => part.length > 0)
              .map((part) => part[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '??';

            const isTranslated = !!translatedTexts[review.id];
            const isTranslating = !!translating[review.id];
            const displayText = translatedTexts[review.id] || review.text;
            const needsTranslation = review.language && review.language !== i18n.language;

            return (
              <article
                key={review.id}
                className="listing-review-card"
              >
                <div className="listing-review-header">
                  <div className="listing-review-author-block">
                    <div className="listing-review-avatar">
                      {review.authorAvatarUrl ? (
                        <img
                          src={review.authorAvatarUrl}
                          alt={review.authorName}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="listing-review-author-meta">
                      <div className="listing-review-author-name">
                        {review.authorName}
                      </div>
                      <div className="listing-review-date">
                        {formattedDate}
                      </div>
                    </div>
                  </div>

                  <div className="listing-review-rating">
                    <span className="listing-review-stars">
                      {filledStars}
                      {emptyStars}
                    </span>
                    <span className="listing-review-rating-value">
                      {review.ratingOverall.toFixed(1)}
                    </span>
                  </div>
                </div>

                <p className="listing-review-text">{displayText}</p>

                {isTranslated && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {t('cafeDetail.translatedAutomatically')}
                  </div>
                )}

                {needsTranslation && (
                  <div style={{ marginTop: '0.75rem' }}>
                    {!isTranslated ? (
                      <button
                        type="button"
                        onClick={() => handleTranslate(review.id, review.text, review.language)}
                        disabled={isTranslating}
                        style={{
                          background: 'none',
                          border: '1px solid #ddd',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '4px',
                          cursor: isTranslating ? 'wait' : 'pointer',
                          fontSize: '0.875rem',
                          color: '#666',
                        }}
                      >
                        {isTranslating ? t('cafeDetail.translating') : t('cafeDetail.translate')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleShowOriginal(review.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #ddd',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#666',
                        }}
                      >
                        {t('cafeDetail.showOriginal')}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* View all-Button */}
      {typeof limit === 'number' &&
        reviews.length > limit &&
        onViewAllClick && (
          <button
            type="button"
            className="listing-reviews-view-all"
            onClick={onViewAllClick}
          >
            {t('cafeDetail.viewAllReviews', { count: reviews.length })}
          </button>
        )}
    </section>
  );
};