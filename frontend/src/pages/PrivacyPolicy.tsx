import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
        {t('privacy.heading')}
      </h1>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        {t('privacy.placeholder')}
      </p>

      {/* Placeholder sections structure */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('privacy.sections.dataCollection')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('privacy.sections.dataUsage')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('privacy.sections.dataSecurity')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('privacy.sections.yourRights')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
