import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiStar, FiMapPin } from 'react-icons/fi';
import '@/styles/components/ui/how-it-works-section.css';

const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    {
      Icon: FiSearch,
      titleKey: 'howItWorks.step1.customTitle',
      descriptionKey: 'howItWorks.step1.customDescription'
    },
    {
      Icon: FiStar,
      titleKey: 'howItWorks.step2.customTitle',
      descriptionKey: 'howItWorks.step2.customDescription'
    },
    {
      Icon: FiMapPin,
      titleKey: 'howItWorks.step3.customTitle',
      descriptionKey: 'howItWorks.step3.customDescription'
    }
  ];

  return (
    <motion.section
      className="how-it-works-section"
      id="how-it-works"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <header className="how-it-works-header">
          <h2 className="how-it-works-title">{t('howItWorks.customTitle')}</h2>
          <p className="how-it-works-subtitle">
            {t('howItWorks.customSubtitle')}
          </p>
        </header>

        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.Icon;
            return (
              <motion.div
                key={step.titleKey}
                className="step"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <div className="step-icon-wrapper">
                  <Icon className="step-icon" />
                </div>
                <h4 className="step-title">{t(step.titleKey)}</h4>
                <p className="step-description">{t(step.descriptionKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorksSection;
