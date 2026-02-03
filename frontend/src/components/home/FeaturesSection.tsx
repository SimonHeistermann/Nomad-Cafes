import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiZap, FiMapPin, FiUsers, FiHeart } from 'react-icons/fi';
import '@/styles/components/ui/features-section.css';

const FeaturesSection: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: FiZap,
      titleKey: 'features.fastWifi.title',
      descriptionKey: 'features.fastWifi.description'
    },
    {
      icon: FiMapPin,
      titleKey: 'features.nomadHotspots.title',
      descriptionKey: 'features.nomadHotspots.description'
    },
    {
      icon: FiUsers,
      titleKey: 'features.realReviews.title',
      descriptionKey: 'features.realReviews.description'
    },
    {
      icon: FiHeart,
      titleKey: 'features.saveFavorites.title',
      descriptionKey: 'features.saveFavorites.description'
    }
  ];

  return (
    <motion.section
      className="features-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <header className="features-header">
          <h2 className="features-title">{t('features.title')}</h2>
        </header>

        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                className="feature"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <div className="feature-icon-wrapper">
                  <Icon className="feature-icon" />
                </div>
                <h4 className="feature-title">{t(feature.titleKey)}</h4>
                <p className="feature-description">{t(feature.descriptionKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;
