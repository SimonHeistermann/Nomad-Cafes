import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const MAX_OVERVIEW_CHARS = 420;

export type OverviewSectionProps = {
  overview?: {
    en: string;
    de: string;
  } | string;
};

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  overview,
}) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!overview) return null;

  // Get overview text based on current language
  const locale = i18n.language as 'en' | 'de';
  const overviewText = typeof overview === 'string'
    ? overview
    : (overview[locale] || overview.en);

  const isLong = overviewText.length > MAX_OVERVIEW_CHARS;
  const visibleText =
    !isLong || expanded
      ? overviewText
      : `${overviewText.slice(0, MAX_OVERVIEW_CHARS)}…`;

  return (
    <section className="listing-section">
      <h2 className="listing-section-title">{t('cafeDetail.overview')}</h2>
      <p className="listing-section-text">{visibleText}</p>
      {isLong && (
        <button
          type="button"
          className="listing-section-link"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? t('common.showLess') : t('common.showMore')}
        </button>
      )}
    </section>
  );
};