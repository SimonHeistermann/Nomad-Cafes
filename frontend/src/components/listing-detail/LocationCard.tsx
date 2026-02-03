import React from 'react';
import { useTranslation } from 'react-i18next';

export type LocationCardProps = {
  name: string;
  city: string;
  addressLine1?: string;
  addressLine2?: string;
};

export const LocationCard: React.FC<LocationCardProps> = ({
  name,
  city,
  addressLine1,
  addressLine2,
}) => {
  const { t } = useTranslation();
  const addressForMap =
    addressLine1 || addressLine2 || `${name}, ${city}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    addressForMap,
  )}&output=embed`;

  return (
    <section className="listing-card">
      <div className="listing-card-body">
        <h3 className="listing-card-title">{t('cafeDetail.location')}</h3>
        <div className="listing-location-map">
          <iframe
            title={`${name} map`}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="listing-location-address">
          {addressLine1 && <p>{addressLine1}</p>}
          {addressLine2 && <p>{addressLine2}</p>}
          {!addressLine1 && !addressLine2 && <p>{city}</p>}
        </div>
      </div>
    </section>
  );
};