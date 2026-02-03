import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
  FaWifi,
  FaMugSaucer,
  FaCreditCard,
  FaCar,
  FaPaw,
  FaSmoking,
  FaPlug,
  FaChair,
  FaLaptop,
} from 'react-icons/fa6';
import { FiCoffee, FiCheck } from 'react-icons/fi';
import { getFeatureTranslationKey, getFeatureDisplayLabel } from '@/lib/constants/features';

export type FeaturesSectionProps = {
  features: string[];
};

const PAGE_SIZE = 6;

function getIconForFeature(label: string): IconType {
  const key = label.toLowerCase();

  if (key.includes('wifi') || key.includes('wireless')) return FaWifi;
  if (key.includes('internet')) return FaWifi;
  if (key.includes('coffee') || key.includes('café')) return FaMugSaucer;
  if (key.includes('espresso')) return FiCoffee;
  if (key.includes('credit') || key.includes('card')) return FaCreditCard;
  if (key.includes('parking') || key.includes('park')) return FaCar;
  if (key.includes('pet')) return FaPaw;
  if (key.includes('smoking') || key.includes('non-smoking'))
    return FaSmoking;
  if (key.includes('outlet') || key.includes('plug')) return FaPlug;
  if (key.includes('seating') || key.includes('chair')) return FaChair;
  if (key.includes('laptop') || key.includes('work')) return FaLaptop;

  // Fallback
  return FiCheck;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  features,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const { pagesCount, currentFeatures, hasSlider } = useMemo(() => {
    const total = features.length;
    const count = Math.ceil(total / PAGE_SIZE);
    const start = page * PAGE_SIZE;
    const slice = features.slice(start, start + PAGE_SIZE);

    return {
      pagesCount: count,
      currentFeatures: slice,
      hasSlider: total > PAGE_SIZE,
    };
  }, [features, page]);

  if (!features || features.length === 0) return null;

  const canPrev = page > 0;
  const canNext = page < pagesCount - 1;

  const handlePrev = () => {
    if (!canPrev) return;
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (!canNext) return;
    setPage((prev) => Math.min(prev + 1, pagesCount - 1));
  };

  return (
    <section className="listing-section listing-features-section">
      <div className="listing-section-header">
        <h2 className="listing-section-title">{t('cafeDetail.features')}</h2>

        {hasSlider && (
          <div className="listing-features-nav" aria-label={t('cafeDetail.features')}>
            <button
              type="button"
              className="listing-features-nav-button"
              onClick={handlePrev}
              disabled={!canPrev}
              aria-label={t('common.previous')}
            >
              ‹
            </button>
            <button
              type="button"
              className="listing-features-nav-button"
              onClick={handleNext}
              disabled={!canNext}
              aria-label={t('common.next')}
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="listing-features-grid">
        {currentFeatures.map((feature) => {
          const Icon = getIconForFeature(feature);
          const translationKey = getFeatureTranslationKey(feature);
          const translatedLabel = t(translationKey);

          // If translation returns the key (missing translation), use display label
          const displayLabel = translatedLabel === translationKey
            ? getFeatureDisplayLabel(feature)
            : translatedLabel;

          return (
            <div key={feature} className="listing-feature-item">
              <div className="listing-feature-icon">
                <Icon />
              </div>
              <span className="listing-feature-label">{displayLabel}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};