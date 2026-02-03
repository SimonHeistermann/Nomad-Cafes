import React from 'react';
import { motion as MOTION } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import '@/styles/components/ui/submit-venue-section.css';

type SubmitVenueSectionProps = {
  email?: string;
  subject?: string;
  body?: string;
};

const SubmitVenueSection: React.FC<SubmitVenueSectionProps> = ({
  email = 'hello@nomadcafes.app',
  subject,
  body,
}) => {
  const { t } = useTranslation();

  const emailSubject = subject || t('submitVenue.emailSubject');
  const emailBody = body || t('submitVenue.emailBody');

  const mailtoHref = `mailto:${encodeURIComponent(
    email,
  )}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <section className="submit-venue-section">
      {/* Vollbreites, blaues Band wie der Footer */}
      <div className="submit-venue-band">
        <div className="app-container">
          <MOTION.div
            className="submit-venue-inner"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
          >
            <div className="submit-venue-copy">
              <h2 className="submit-venue-title">
                {t('submitVenue.title')}
              </h2>
              <p className="submit-venue-text">
                {t('submitVenue.description')}
              </p>
            </div>

            <div className="submit-venue-action">
              <a href={mailtoHref} className="submit-venue-button">
                {t('submitVenue.buttonText')}
              </a>
            </div>
          </MOTION.div>
        </div>
      </div>
    </section>
  );
};

export default SubmitVenueSection;
