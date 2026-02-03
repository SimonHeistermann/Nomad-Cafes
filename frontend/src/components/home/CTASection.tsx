import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import '@/styles/components/ui/cta-section.css';

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.section
      className="cta-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="app-container">
        <div className="cta-box">
          <h2 className="cta-title">{t('footer.cta.customTitle')}</h2>
          <p className="cta-subtitle">{t('footer.cta.customSubtitle')}</p>

          <div className="cta-buttons">
            <Button
              onClick={() => navigate('/explore')}
              variant="primary"
              size="lg"
            >
              {t('footer.cta.browseCafes')}
            </Button>
            <Button
              onClick={() => navigate('/register')}
              variant="outline"
              size="lg"
            >
              {t('footer.cta.signupFree')}
            </Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CTASection;
