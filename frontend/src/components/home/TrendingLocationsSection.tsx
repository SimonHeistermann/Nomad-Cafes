import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LocationTile from '../ui/LocationTile';
import '@/styles/components/ui/trending-locations.css';
import { useTrendingLocations } from '@/lib/hooks/useLocations';
import type { TrendingLocation } from '@/types/location';

type TrendingLocationsProps = {
  locations?: TrendingLocation[];
  onLocationClick?: (location: TrendingLocation) => void;
};

const TrendingLocationsSection: React.FC<TrendingLocationsProps> = ({
  locations: propLocations,
  onLocationClick,
}) => {
  const { t } = useTranslation();

  // Fetch from API
  const { locations: apiLocations, isLoading } = useTrendingLocations(4);

  // Transform API locations to TrendingLocation format
  const displayLocations: TrendingLocation[] = useMemo(() => {
    if (propLocations) return propLocations;

    return apiLocations.map(loc => ({
      id: loc.slug, // Use slug for URL navigation, not database ID
      name: loc.name,
      subtitle: loc.cafeCount > 0
        ? t('trendingLocations.cafeCount', { count: loc.cafeCount })
        : undefined,
      imageUrl: loc.imageUrl || `https://source.unsplash.com/800x600/?${encodeURIComponent(loc.name)},city`,
    }));
  }, [propLocations, apiLocations, t]);

  if (isLoading) {
    return (
      <section className="trending-section">
        <div className="app-container">
          <header className="trending-section-header">
            <h2 className="trending-section-title">{t('trendingLocations.customTitle')}</h2>
            <p className="trending-section-subtitle">
              {t('trendingLocations.customSubtitle')}
            </p>
          </header>
          <div className="trending-loading">
            <div className="loading-spinner" />
          </div>
        </div>
      </section>
    );
  }

  if (!displayLocations || displayLocations.length === 0) return null;

  return (
    <motion.section
      className="trending-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <header className="trending-section-header">
          <h2 className="trending-section-title">{t('trendingLocations.customTitle')}</h2>
          <p className="trending-section-subtitle">
            {t('trendingLocations.customSubtitle')}
          </p>
        </header>

        <div className="trending-grid">
          {displayLocations.map((location) => (
            <div key={location.id} className="trending-grid-item">
              <LocationTile
                location={location}
                onClick={onLocationClick}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default TrendingLocationsSection;
