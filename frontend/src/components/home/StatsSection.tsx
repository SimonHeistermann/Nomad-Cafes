import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStats } from '@/lib/hooks/useStats';
import CountUpNumber from '@/components/ui/CountUpNumber';
import '@/styles/components/ui/stats-section.css';

const StatsSection: React.FC = () => {
  const { t } = useTranslation();

  // Fetch stats from API
  const { stats, isLoading } = useStats();

  // Use actual counts from API
  const cafeCount = stats?.cafes || 0;
  const reviewCount = stats?.reviews || 0;
  const locationCount = stats?.locations || 0;
  const userCount = stats?.users || 0;

  // If all stats are 0 (no seed data or API error), hide section entirely
  const hasAnyData = cafeCount > 0 || reviewCount > 0 || locationCount > 0 || userCount > 0;

  // For "happy nomads", multiply user count for marketing effect
  const nomadCount = userCount > 0 ? userCount * 100 : 0;

  // Format large numbers (e.g., 2300 -> "2.3k")
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return num.toString();
  };

  if (isLoading) {
    return (
      <section className="stats-section">
        <div className="app-container">
          <div className="stats-loading" style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if there's no data (no seed data or API error)
  if (!hasAnyData) {
    return null;
  }

  return (
    <motion.section
      className="stats-section"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <header className="stats-header">
          <h2 className="stats-section-title">{t('stats.title')}</h2>
        </header>

        <div className="stats-grid">
          <div className="stat-item">
            <h3 className="stat-number">
              <CountUpNumber
                end={cafeCount}
                duration={2000}
                suffix={<span className="stat-plus">+</span>}
              />
            </h3>
            <p className="stat-label">{t('stats.cafesListed')}</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">
              <CountUpNumber
                end={reviewCount}
                duration={2500}
                suffix={<span className="stat-plus">+</span>}
              />
            </h3>
            <p className="stat-label">{t('stats.communityReviews')}</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">
              <CountUpNumber
                end={locationCount}
                duration={1800}
                suffix={<span className="stat-plus">+</span>}
              />
            </h3>
            <p className="stat-label">{t('stats.locationsWorldwide')}</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">
              <CountUpNumber
                end={nomadCount}
                duration={2500}
                format={formatNumber}
                suffix={<span className="stat-plus">+</span>}
              />
            </h3>
            <p className="stat-label">{t('stats.happyNomads')}</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default StatsSection;
