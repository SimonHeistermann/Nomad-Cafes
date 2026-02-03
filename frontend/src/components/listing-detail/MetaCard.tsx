import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaGlobe,
  FaInstagram,
  FaFacebookF,
  FaTiktok,
} from 'react-icons/fa6';
import { translatePriceRangeLabel } from '@/lib/utils/pricing';

export type MetaCardProps = {
  priceRangeLabel?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  ownerName?: string;
  ownerRole?: string;
};

export const MetaCard: React.FC<MetaCardProps> = ({
  priceRangeLabel,
  websiteUrl,
  instagramUrl,
  facebookUrl,
  tiktokUrl,
  ownerName,
  ownerRole,
}) => {
  const { t, i18n } = useTranslation();
  const hasSocial =
    websiteUrl || instagramUrl || facebookUrl || tiktokUrl;

  if (!priceRangeLabel && !hasSocial && !ownerName) return null;

  const translatedPriceLabel = priceRangeLabel
    ? translatePriceRangeLabel(priceRangeLabel, i18n.language, t)
    : undefined;

  return (
    <section className="listing-card">
      <div className="listing-card-body listing-meta-card">
        {translatedPriceLabel && (
          <div className="listing-meta-block">
            <h4 className="listing-meta-label">{t('cafeDetail.priceRange')}</h4>
            <p className="listing-meta-value">{translatedPriceLabel}</p>
          </div>
        )}

        {ownerName && (
          <div className="listing-meta-block">
            <h4 className="listing-meta-label">{t('cafeDetail.author')}</h4>
            <p className="listing-meta-value">
              {ownerName}
              {ownerRole ? (
                <span className="listing-meta-sub">{ownerRole}</span>
              ) : null}
            </p>
          </div>
        )}

        {hasSocial && (
          <div className="listing-meta-block">
            <h4 className="listing-meta-label">{t('cafeDetail.connect')}</h4>
            <div className="listing-meta-social">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Website"
                >
                  <FaGlobe />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="TikTok"
                >
                  <FaTiktok />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};