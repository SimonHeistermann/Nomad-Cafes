import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <main
      className="app-container"
      style={{ padding: '100px 0', textAlign: 'center' }}
    >
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        {t('errors.notFound.title')}
      </h1>
      <p style={{ marginBottom: '24px' }}>
        {t('errors.notFound.message')}
      </p>
      <Link to="/" className="btn-primary">
        {t('errors.notFound.goHome')}
      </Link>
    </main>
  );
};

export default NotFound;
