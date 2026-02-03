/**
 * OpenStatus component displays whether a business is currently open or closed.
 *
 * Features:
 * - Shows "Open" or "Closed" status with appropriate styling
 * - Optional "Opens at X" message when closed
 * - Timezone-aware (uses the cafe's timezone)
 *
 * Usage:
 * ```tsx
 * <OpenStatus
 *   openingHours={cafe.openingHours}
 *   timeZone={cafe.timeZone}
 *   variant="badge"
 * />
 * ```
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OpeningHoursEntry } from '@/types/cafe';
import { getOpenStateForNow, formatTimeForLocale } from '@/lib/utils/opening-hours';

export interface OpenStatusProps {
  /** Opening hours entries */
  openingHours?: OpeningHoursEntry[];
  /** IANA timezone (e.g., "Europe/Berlin") */
  timeZone?: string;
  /** Visual variant */
  variant?: 'badge' | 'text' | 'detailed';
  /** Show "Opens at X" when closed */
  showOpensAt?: boolean;
  /** Custom class name */
  className?: string;
}

export const OpenStatus: React.FC<OpenStatusProps> = ({
  openingHours,
  timeZone,
  variant = 'badge',
  showOpensAt = true,
  className = '',
}) => {
  const { t, i18n } = useTranslation();

  const openState = getOpenStateForNow(openingHours ?? [], false, timeZone);

  // If no opening hours data, don't render anything
  if (!openState.hasOpeningHours) {
    return null;
  }

  const isOpen = openState.isOpenNow;
  const opensAt = openState.opensAt
    ? formatTimeForLocale(openState.opensAt, i18n.language)
    : undefined;

  if (variant === 'text') {
    return (
      <span
        className={`open-status-text ${isOpen ? 'open-status-text--open' : 'open-status-text--closed'} ${className}`}
        style={{
          color: isOpen ? '#16a34a' : '#dc2626',
          fontWeight: 500,
        }}
      >
        {isOpen ? t('cafeCard.open') : t('cafeCard.closed')}
        {!isOpen && showOpensAt && opensAt && (
          <span style={{ fontWeight: 400, marginLeft: '0.25rem' }}>
            ({t('openStatus.opensAt', { time: opensAt })})
          </span>
        )}
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`open-status-detailed ${className}`}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOpen ? '#16a34a' : '#dc2626',
            }}
          />
          <span style={{ fontWeight: 500, color: isOpen ? '#16a34a' : '#dc2626' }}>
            {isOpen ? t('cafeCard.open') : t('cafeCard.closed')}
          </span>
        </span>
        {!isOpen && showOpensAt && opensAt && (
          <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
            {t('openStatus.opensAt', { time: opensAt })}
          </span>
        )}
      </div>
    );
  }

  // Default: badge variant
  return (
    <span
      className={`open-status-badge ${isOpen ? 'open-status-badge--open' : 'open-status-badge--closed'} ${className}`}
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: isOpen ? '#dcfce7' : '#fee2e2',
        color: isOpen ? '#16a34a' : '#dc2626',
      }}
    >
      {isOpen ? t('cafeCard.open') : t('cafeCard.closed')}
    </span>
  );
};

export default OpenStatus;
