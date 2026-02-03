import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
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
import '@/styles/components/navigation/home-footer.css';

const HomeFooter: React.FC = () => {
  const navigate = useNavigate();
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
    <footer className="home-footer">
      {/* CTA Section */}
      <motion.div
        className="home-footer-cta"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="app-container">
          <div className="home-footer-cta-content">
            <h2 className="home-footer-cta-title">
              {t('footer.cta.customTitle')}
            </h2>
            <p className="home-footer-cta-subtitle">
              {t('footer.cta.customSubtitle')}
            </p>

            <div className="home-footer-cta-buttons">
              <Button
                onClick={() => {
                  navigate('/explore');
                  window.scrollTo(0, 0);
                }}
                variant="primary"
                size="lg"
              >
                {t('footer.cta.browseCafes')}
              </Button>
              <Button
                onClick={() => {
                  navigate('/register');
                  window.scrollTo(0, 0);
                }}
                variant="outline"
                size="lg"
              >
                {t('footer.cta.signupFree')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Content */}
      <div className="home-footer-main">
        <div className="app-container home-footer-grid">
          {/* Column 1: Contact */}
          <div className="home-footer-column">
            <h4 className="home-footer-heading">{t('footer.contact.customTitle')}</h4>

            <ul className="home-footer-contact-list">
              <li>
                <span className="home-footer-contact-icon">
                  <FaLocationDot aria-hidden="true" />
                </span>
                <span>
                  {t('footer.contact.customAddress')}
                </span>
              </li>

              <li>
                <span className="home-footer-contact-icon">
                  <FaPhone aria-hidden="true" />
                </span>
                <a
                  href="tel:+4915772897831"
                  className="home-footer-contact-link"
                >
                  {t('footer.contact.customPhone')}
                </a>
              </li>

              <li>
                <span className="home-footer-contact-icon">
                  <FaEnvelope aria-hidden="true" />
                </span>
                <a
                  href="mailto:hello@nomadcafes.app"
                  className="home-footer-contact-link"
                >
                  {t('footer.contact.customEmail')}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Company */}
          <div className="home-footer-column">
            <h4 className="home-footer-heading">{t('footer.company.title')}</h4>

            <Link to="/about" className="home-footer-link">
              {t('footer.company.aboutShort')}
            </Link>

            <Link to="/#how-it-works" className="home-footer-link">
              {t('footer.company.howItWorks')}
            </Link>

            <Link to="/faq" className="home-footer-link">
              {t('footer.company.faq')}
            </Link>

            <Link to="/terms" className="home-footer-link">
              {t('footer.company.terms')}
            </Link>
          </div>

          {/* Column 3: Discover */}
          <div className="home-footer-column">
            <h4 className="home-footer-heading">{t('footer.discover.title')}</h4>

            {discoverLinks.map((location, index) => {
              if (location.slug === 'coming-soon') {
                return (
                  <Link key={`coming-soon-${index}`} to="/explore" className="home-footer-link">
                    {t('footer.discover.comingSoon')}
                  </Link>
                );
              }

              return (
                <Link
                  key={location.slug}
                  to={`/explore?location=${encodeURIComponent(location.slug)}`}
                  className="home-footer-link"
                >
                  {location.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="home-footer-bottom">
        <div className="app-container home-footer-bottom-inner">
          <span className="home-footer-copy">
            {t('footer.customCopyright', { year })}
          </span>

          <div className="home-footer-brand">
            <div
              className="home-footer-logo-mark"
              aria-hidden="true"
            >
              N
            </div>
            <span className="home-footer-brand-name">
              {t('footer.customBrandName')}
            </span>
          </div>

          <div className="home-footer-social">
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

export default HomeFooter;
