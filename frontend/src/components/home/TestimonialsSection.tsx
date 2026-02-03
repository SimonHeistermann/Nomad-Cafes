import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaStar } from 'react-icons/fa6';
import '@/styles/components/ui/testimonials-section.css';
import { useStats } from '@/lib/hooks/useStats';

/**
 * Round a number down to a "nice" marketing-friendly number
 * Examples: 523 -> 500, 890 -> 800, 1234 -> 1200, 2567 -> 2500
 */
function floorToNiceNumber(num: number): number {
  if (num < 100) return Math.floor(num / 10) * 10;
  if (num < 1000) return Math.floor(num / 100) * 100;
  if (num < 10000) return Math.floor(num / 100) * 100;
  return Math.floor(num / 1000) * 1000;
}

const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();
  const { stats } = useStats();

  // Calculate a nice rounded number for the stat text
  const niceNumber = useMemo(() => {
    const cafeCount = stats?.cafes || 0;
    // Use cafes as a proxy for "café owners", with a minimum for display
    const count = Math.max(cafeCount, 100);
    return floorToNiceNumber(count);
  }, [stats]);

  const results = [
    {
      id: '1',
      metricKey: 'testimonials.result1.metric',
      metricLabelKey: 'testimonials.result1.metricLabel',
      quoteKey: 'testimonials.result1.quote',
      authorKey: 'testimonials.result1.author',
      roleKey: 'testimonials.result1.role',
      variant: 'light' as const,
    },
    {
      id: '2',
      metricKey: 'testimonials.result2.metric',
      metricLabelKey: 'testimonials.result2.metricLabel',
      quoteKey: 'testimonials.result2.quote',
      authorKey: 'testimonials.result2.author',
      roleKey: 'testimonials.result2.role',
      variant: 'dark' as const,
    },
    {
      id: '3',
      metricKey: 'testimonials.result3.metric',
      metricLabelKey: 'testimonials.result3.metricLabel',
      quoteKey: 'testimonials.result3.quote',
      authorKey: 'testimonials.result3.author',
      roleKey: 'testimonials.result3.role',
      variant: 'light' as const,
    },
  ];

  return (
    <motion.section
      className="testimonials-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <header className="testimonials-header">
          <span className="testimonials-label">{t('testimonials.customLabel')}</span>
          <h2 className="testimonials-title">{t('testimonials.title')}</h2>
          <p className="testimonials-subtitle">
            {t('testimonials.customSubtitle')}
          </p>
        </header>

        <div className="results-grid">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              className={`result-card result-card--${result.variant}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <div className="result-metric">
                <h3 className="result-number">{t(result.metricKey)}</h3>
                <p className="result-label">{t(result.metricLabelKey)}</p>
              </div>

              <blockquote className="result-quote">
                <p className="result-quote-text">"{t(result.quoteKey)}"</p>
                <footer className="result-author">
                  <strong className="result-author-name">{t(result.authorKey)}</strong>
                  <span className="result-author-role">{t(result.roleKey)}</span>
                </footer>
              </blockquote>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="testimonials-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="testimonials-stats">
            <span className="testimonials-stat-text">
              {t('testimonials.footer.dynamicStatText', { count: niceNumber })}
            </span>
            <div className="testimonials-rating">
              <div className="testimonials-stars">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="testimonials-star" />
                ))}
              </div>
              <span className="testimonials-rating-text">{t('testimonials.footer.customRating')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default TestimonialsSection;
