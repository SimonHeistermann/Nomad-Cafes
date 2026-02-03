import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OpeningHoursEntry } from '@/types/cafe';
import { getOpenStateForNow, formatTimeForLocale } from '@/lib/utils/opening-hours';

export type HoursCardProps = {
  openingHours: OpeningHoursEntry[];
  isOpen: boolean;
  timeZone?: string; // ⬅️ NEU
};

export const HoursCard: React.FC<HoursCardProps> = ({
  openingHours,
  isOpen,
  timeZone,
}) => {
  const { t, i18n } = useTranslation();

  if (!openingHours || openingHours.length === 0) return null;

  const { isOpenNow } = getOpenStateForNow(
    openingHours,
    isOpen,
    timeZone,
  );

  const label = isOpenNow ? t('cafeDetail.nowOpen') : t('cafeDetail.nowClosed');
  const locale = i18n.language;

  return (
    <section className="listing-card">
      <div className="listing-card-body">
        <div className="listing-card-header-row">
          <h3 className="listing-card-title">{t('cafeDetail.hours')}</h3>
          <span
            className={`listing-hours-badge ${
              isOpenNow
                ? 'listing-hours-badge--open'
                : 'listing-hours-badge--closed'
            }`}
          >
            {label}
          </span>
        </div>

        <dl className="listing-hours-list">
          {openingHours.map((entry) => {
            const formattedOpen = formatTimeForLocale(entry.open, locale);
            const formattedClose = formatTimeForLocale(entry.close, locale);
            // Capitalize first letter to match i18n keys (days.Monday, days.Tuesday, etc.)
            const dayKey = entry.day.charAt(0).toUpperCase() + entry.day.slice(1).toLowerCase();
            // Use fallback to original day name if translation key doesn't exist
            const translationKey = `days.${dayKey}`;
            const translatedDay = i18n.exists(translationKey)
              ? t(translationKey)
              : dayKey; // Fallback to formatted day name

            return (
              <div key={entry.day} className="listing-hours-row">
                <dt>{translatedDay}</dt>
                <dd>
                  {entry.isClosed
                    ? t('cafeCard.closed')
                    : `${formattedOpen} – ${formattedClose}`}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
};