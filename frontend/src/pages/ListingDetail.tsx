import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@/styles/pages/listing-detail.css';

import { useCafe } from '@/lib/hooks/useCafes';
import { useReviews, calculateReviewsSummary } from '@/lib/hooks/useReviews';
import { useFavorites } from '@/contexts';

import { ListingHeader } from '@/components/listing-detail/ListingHeader';
import { ListingGallery } from '@/components/listing-detail/ListingGallery';
import { OverviewSection } from '@/components/listing-detail/OverviewSection';
import { FeaturesSection } from '@/components/listing-detail/FeaturesSection';
import { FaqSection } from '@/components/listing-detail/FaqSection';
import { LocationCard } from '@/components/listing-detail/LocationCard';
import { HoursCard } from '@/components/listing-detail/HoursCard';
import { MetaCard } from '@/components/listing-detail/MetaCard';
import { ContactCard } from '@/components/listing-detail/ContactCard';

import { ReviewsSection } from '@/components/listing-detail/ReviewsSection';
import { AddReviewSection } from '@/components/listing-detail/AddReviewSection';
import { getPriceLabelForLocale } from '@/lib/utils/pricing';

type RouteParams = {
  id: string;
};

const ListingDetail: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Fetch cafe from API
  const { cafe, isLoading, error } = useCafe(id);

  // Fetch reviews separately (API doesn't include reviews in cafe response)
  const { reviews: fetchedReviews, totalCount: reviewsTotalCount, refetch: refetchReviews } = useReviews(cafe?.slug || id);

  // Calculate reviews summary from fetched reviews
  const computedReviewsSummary = useMemo(() => {
    if (fetchedReviews.length === 0) return undefined;
    return calculateReviewsSummary(fetchedReviews);
  }, [fetchedReviews]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [id]);

  // Loading state
  if (isLoading) {
    return (
      <main className="listing-detail-main">
        <div className="app-container listing-detail-loading">
          <div className="loading-spinner" />
          <p>{t('common.loading')}</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="listing-detail-main">
        <div className="app-container listing-detail-not-found">
          <h1>{t('common.error')}</h1>
          <p>{error}</p>
          <button
            type="button"
            className="btn-primary listing-detail-back-button"
            onClick={() => navigate(-1)}
          >
            {t('cafeDetail.notFound.goBack')}
          </button>
        </div>
      </main>
    );
  }

  // Not found state
  if (!cafe) {
    return (
      <main className="listing-detail-main">
        <div className="app-container listing-detail-not-found">
          <h1>{t('cafeDetail.notFound.title')}</h1>
          <p>
            {t('cafeDetail.notFound.description')}
          </p>
          <button
            type="button"
            className="btn-primary listing-detail-back-button"
            onClick={() => navigate(-1)}
          >
            {t('cafeDetail.notFound.goBack')}
          </button>
        </div>
      </main>
    );
  }

  const {
    name,
    description,
    imageUrl,
    priceLevel,
    isOpen,
    rating,
    reviewCount,
    phone,
    city,
    timeZone,
    overview,
    galleryImages,
    addressLine1,
    addressLine2,
    websiteUrl,
    instagramUrl,
    facebookUrl,
    tiktokUrl,
    openingHours,
    features,
    faqs,
    priceRangeLabel,
    ownerName,
    ownerRole,
    reviewsSummary,
    allowsContact,
    logoUrl,
  } = cafe;

  // Extract localized description
  const localizedDescription = typeof description === 'string'
    ? description
    : description[i18n.language as 'en' | 'de'] || description.en;

  const priceLabel = getPriceLabelForLocale(priceLevel || 1, i18n.language);

  const mainImage =
    (galleryImages && galleryImages[0]) ||
    imageUrl ||
    '/images/demo/placeholder.jpg';
  const additionalImages = galleryImages ? galleryImages.slice(1) : [];

  const canSubmitReviews = true;

  return (
    <main className="listing-detail-main">
      <div className="app-container">
        {/* Header */}
        <ListingHeader
          name={name}
          city={city}
          phone={phone}
          rating={rating}
          reviewCount={reviewCount}
          priceLabel={priceLabel}
          isOpen={isOpen}
          description={localizedDescription}
          isFavorite={isFavorite(cafe.id)}
          onToggleFavorite={() => toggleFavorite(cafe.id)}
          openingHours={openingHours ?? []}
          timeZone={timeZone}
          logoUrl={logoUrl}
        />

        {/* Layout */}
        <div className="listing-detail-layout">
          <section className="listing-detail-main-column">
            <ListingGallery
              mainImage={mainImage}
              additionalImages={additionalImages}
              name={name}
            />

            <OverviewSection overview={overview} />

            <FeaturesSection features={features ?? []} />

            <FaqSection items={faqs ?? []} />

            {/* Reviews: Summary + Liste (nur die ersten 3) */}
            <ReviewsSection
              rating={rating}
              reviewCount={reviewsTotalCount || reviewCount}
              reviewsSummary={computedReviewsSummary || reviewsSummary}
              reviews={fetchedReviews}
              limit={3}
              onViewAllClick={() => {
                navigate(`/listing/${cafe.id}/reviews`);
              }}
            />

            {/* Add Review */}
            <AddReviewSection
              cafeId={cafe.id}
              cafeSlug={cafe.slug}
              canSubmit={canSubmitReviews}
              onReviewSubmitted={refetchReviews}
            />
          </section>

          <aside className="listing-detail-sidebar">
            <LocationCard
              name={name}
              city={city}
              addressLine1={addressLine1}
              addressLine2={addressLine2}
            />

            <HoursCard
              openingHours={openingHours ?? []}
              isOpen={isOpen}
              timeZone={timeZone}
            />

            <MetaCard
              priceRangeLabel={priceRangeLabel}
              websiteUrl={websiteUrl}
              instagramUrl={instagramUrl}
              facebookUrl={facebookUrl}
              tiktokUrl={tiktokUrl}
              ownerName={ownerName}
              ownerRole={ownerRole}
            />

            {allowsContact && <ContactCard />}
          </aside>
        </div>
      </div>
    </main>
  );
};

export default ListingDetail;
