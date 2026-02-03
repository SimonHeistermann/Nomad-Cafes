import React from 'react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main className="app-container" style={{ padding: '80px 0' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        {t('about.heading')}
      </h1>
      <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
        {t('about.placeholder')}
      </p>
    </main>
  );
};

export default About;
