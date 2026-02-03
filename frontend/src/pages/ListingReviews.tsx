import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '@/styles/pages/listing-detail.css';

import { useCafe } from '@/lib/hooks/useCafes';
import { useReviews, calculateReviewsSummary } from '@/lib/hooks/useReviews';
import { ReviewsSection } from '@/components/listing-detail/ReviewsSection';

type RouteParams = {
  id: string;
};

const ListingReviews: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();

  // Fetch cafe data
  const { cafe, isLoading: cafeLoading, error: cafeError } = useCafe(id);

  // Fetch reviews for this cafe
  const { reviews, totalCount, isLoading: reviewsLoading } = useReviews(id);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [id]);

  // Show loading state
  if (cafeLoading || reviewsLoading) {
    return (
      <main className="listing-detail-main">
        <div className="app-container">
          <div className="listing-detail-loading">
            <div className="loading-spinner" />
            <p>Loading reviews...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error or not found state
  if (cafeError || !cafe) {
    return (
      <main className="listing-detail-main">
        <div className="app-container listing-detail-not-found">
          <h1>Listing not found</h1>
          <p>
            We couldn&apos;t find this café. It might have been
            removed or the URL is incorrect.
          </p>
          <button
            type="button"
            className="btn-primary listing-detail-back-button"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const { slug, name, rating } = cafe;

  // Calculate reviews summary from actual reviews
  const reviewsSummary = calculateReviewsSummary(reviews);

  return (
    <main className="listing-detail-main">
      <div className="app-container">
        <div className="listing-reviews-page-header">
          <button
            type="button"
            className="listing-reviews-back-btn"
            onClick={() => navigate(`/listing/${slug || id}`)}
          >
            ← Back to listing
          </button>
          <h1 className="listing-reviews-page-title">
            {name} – all reviews
          </h1>
        </div>

        <section className="listing-detail-main-column">
          <ReviewsSection
            rating={rating}
            reviewCount={totalCount}
            reviewsSummary={reviewsSummary}
            reviews={reviews}
          />
        </section>
      </div>
    </main>
  );
};

export default ListingReviews;
