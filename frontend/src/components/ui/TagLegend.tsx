import React from 'react';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from './InfoIcon';

export const TagLegend: React.FC = () => {
  const { t } = useTranslation();

  const legendContent = (
    <div>
      {/* Fast WiFi Tag */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h4>{t('filters.legend.wifi.title')}</h4>
        <p>{t('filters.legend.wifi.fast')}</p>
      </div>

      {/* Disclaimer */}
      <div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #6c757d)' }}>
          {t('filters.legend.disclaimer.description')}
        </p>
      </div>
    </div>
  );

  return <InfoIcon content={legendContent} position="top" />;
};
