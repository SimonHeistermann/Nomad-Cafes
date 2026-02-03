import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { motion as MOTION } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CardListing from '../ui/CardListing';
import '@/styles/components/ui/popular-section.css';

import type { Cafe } from '@/types/cafe';
import { usePopularCafes } from '@/lib/hooks/useCafes';

const PopularCafesSection: React.FC = () => {
  const { t } = useTranslation();

  const [isMobile, setIsMobile] = useState(() => {
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [page, setPage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Fetch popular cafes from API
  const { cafes: popularCafes, isLoading } = usePopularCafes(9);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const itemsPerPage = isMobile ? 1 : 3;

  const pages = useMemo(() => {
    const result: Cafe[][] = [];
    for (let i = 0; i < popularCafes.length; i += itemsPerPage) {
      result.push(popularCafes.slice(i, i + itemsPerPage));
    }
    return result;
  }, [popularCafes, itemsPerPage]);

  const totalPages = pages.length;
  const currentPage = Math.min(page, Math.max(totalPages - 1, 0));

  const goToPage = (index: number) => {
    if (index < 0 || index >= totalPages) return;
    setPage(index);
  };

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    if (!isMobile) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    if (!isMobile || touchStartX.current == null) return;
    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX == null) return;

    const deltaX = touchEndX - touchStartX.current;

    if (Math.abs(deltaX) > 48) {
      if (deltaX < 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    }

    touchStartX.current = null;
  };

  // Don't render if loading or no cafes
  if (isLoading) {
    return (
      <section className="popular-section" id="popular-cafes">
        <div className="app-container">
          <header className="popular-section-header">
            <h2 className="popular-section-title">
              {t('popularCafes.title')}
            </h2>
            <p className="popular-section-subtitle">
              {t('popularCafes.subtitle')}
            </p>
          </header>
          <div className="popular-section-loading">
            <div className="loading-spinner" />
          </div>
        </div>
      </section>
    );
  }

  if (popularCafes.length === 0) {
    return null;
  }

  return (
    <MOTION.section
      className="popular-section"
      id="popular-cafes"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <header className="popular-section-header">
          <h2 className="popular-section-title">
            {t('popularCafes.title')}
          </h2>
          <p className="popular-section-subtitle">
            {t('popularCafes.subtitle')}
          </p>
        </header>

        <div
          className="popular-slider-viewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <MOTION.div
            className="popular-slider-track"
            animate={{ x: `-${currentPage * 100}%` }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
          >
            {pages.map((pageItems, index) => (
              <div key={index} className="popular-slider-page">
                {pageItems.map((cafe) => (
                  <CardListing key={cafe.id} cafe={cafe} />
                ))}
              </div>
            ))}
          </MOTION.div>
        </div>

        {/* Pagination Dots */}
        <div className="popular-slider-dots">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`popular-slider-dot ${
                index === currentPage
                  ? 'popular-slider-dot--active'
                  : ''
              }`}
              onClick={() => goToPage(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </MOTION.section>
  );
};

export default PopularCafesSection;
