import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import '@/styles/layout/layout.css';
import '@/styles/components/navigation/footer.css';

import {
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
  FaLocationDot,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa6';

import { useTrendingLocations } from '@/lib/hooks/useLocations';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  // Get top 4 locations from API
  const { locations: trendingLocations } = useTrendingLocations(4);

  // Map to display format, fill remaining slots with "Coming Soon"
  const discoverLinks = trendingLocations.map(loc => ({
    slug: loc.slug,
    name: loc.name,
  }));
  while (discoverLinks.length < 4) {
    discoverLinks.push({ slug: 'coming-soon', name: '' });
  }

  return (
    <footer className="site-footer">
      <div className="app-container footer-inner">
        {/* Column 1: Contact */}
        <div className="footer-column">
          <h4 className="footer-heading">{t('footer.contact.customTitle')}</h4>

          <ul className="footer-contact-list">
            <li>
              <span className="footer-contact-icon">
                <FaLocationDot aria-hidden="true" />
              </span>
              <span style={{ whiteSpace: 'pre-line' }}>{t('footer.contact.customAddress')}</span>
            </li>

            <li>
              <span className="footer-contact-icon">
                <FaPhone aria-hidden="true" />
              </span>
              <a
                href={`tel:${t('footer.contact.customPhone').replace(/\s/g, '')}`}
                className="footer-contact-link"
              >
                {t('footer.contact.customPhone')}
              </a>
            </li>

            <li>
              <span className="footer-contact-icon">
                <FaEnvelope aria-hidden="true" />
              </span>
              <a
                href={`mailto:${t('footer.contact.customEmail')}`}
                className="footer-contact-link"
              >
                {t('footer.contact.customEmail')}
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2: Company */}
        <div className="footer-column">
          <h4 className="footer-heading">{t('footer.company.title')}</h4>

          <Link to="/about" className="footer-link">
            {t('footer.company.aboutShort')}
          </Link>

          <Link to="/#how-it-works" className="footer-link">
            {t('footer.company.howItWorks')}
          </Link>

          <Link to="/faq" className="footer-link">
            {t('footer.company.faq')}
          </Link>

          <Link to="/terms" className="footer-link">
            {t('footer.company.terms')}
          </Link>
        </div>

        {/* Column 3: Discover */}
        <div className="footer-column">
          <h4 className="footer-heading">{t('footer.discover.title')}</h4>

          {discoverLinks.map((location, index) => {
            if (location.slug === 'coming-soon') {
              return (
                <Link key={`coming-soon-${index}`} to="/explore" className="footer-link">
                  {t('footer.discover.comingSoon')}
                </Link>
              );
            }

            return (
              <Link
                key={location.slug}
                to={`/explore?location=${encodeURIComponent(location.slug)}`}
                className="footer-link"
              >
                {location.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <div className="app-container footer-bottom-inner">
          <span className="footer-copy">
            {t('footer.customCopyright', { year })}
          </span>

          <div className="footer-brand">
            <div
              className="footer-logo-mark"
              aria-hidden="true"
            >
              N
            </div>
            <span className="footer-brand-name">
              {t('footer.customBrandName')}
            </span>
          </div>

          <div className="footer-social">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn />
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>

            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="TikTok"
            >
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
