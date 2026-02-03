import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reviewsApi } from '@/api/reviews';
import { UserReview } from '@/types/cafe';
import { FiStar, FiMapPin, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import '@/styles/pages/my-reviews.css';

/**
 * My Reviews page - displays user's submitted reviews.
 * ProtectedRoute ensures authentication before rendering.
 */
const MyReviews: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await reviewsApi.getMyReviews();
        setReviews(response.results);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setError(t('myReviews.error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [t]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <main className="my-reviews-page">
      <div className="app-container">
        <div className="my-reviews-header">
          <h1 className="my-reviews-title">{t('myReviews.title')}</h1>
          <p className="my-reviews-subtitle">
            {reviews.length > 0
              ? t('myReviews.subtitle', { count: reviews.length })
              : t('myReviews.noReviews')}
          </p>
        </div>

        {isLoading ? (
          <div className="my-reviews-loading">
            <div className="loading-spinner" />
            <p>{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="my-reviews-error">
            <p>{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="my-reviews-empty">
            <FiMessageSquare size={64} />
            <h2>{t('myReviews.emptyTitle')}</h2>
            <p>{t('myReviews.emptyDescription')}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/explore')}
            >
              {t('myReviews.exploreCafes')}
            </button>
          </div>
        ) : (
          <div className="my-reviews-list">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="my-review-card"
                onClick={() => navigate(`/listing/${review.cafeSlug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/listing/${review.cafeSlug}`);
                }}
              >
                <div className="my-review-cafe-info">
                  {review.cafeThumbnail && (
                    <img
                      src={review.cafeThumbnail}
                      alt={review.cafeName}
                      className="my-review-cafe-image"
                    />
                  )}
                  <div className="my-review-cafe-details">
                    <h3 className="my-review-cafe-name">{review.cafeName}</h3>
                    <div className="my-review-cafe-location">
                      <FiMapPin size={14} />
                      <span>{review.cafeCity}</span>
                    </div>
                  </div>
                </div>

                <div className="my-review-content">
                  <div className="my-review-rating">
                    <FiStar className="my-review-star" />
                    <span className="my-review-rating-value">{review.ratingOverall}</span>
                    <span className="my-review-date">
                      <FiCalendar size={12} />
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="my-review-text">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyReviews;
