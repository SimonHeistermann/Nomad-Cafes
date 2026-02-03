import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
        {t('terms.heading')}
      </h1>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        {t('terms.placeholder')}
      </p>

      {/* Placeholder sections structure */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('terms.sections.acceptance')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('terms.sections.userAccounts')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('terms.sections.contentLiability')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
          {t('terms.sections.disclaimers')}
        </h2>
        <p style={{ color: '#6c757d' }}>Content coming soon...</p>
      </div>
    </div>
  );
};

export default TermsOfService;
