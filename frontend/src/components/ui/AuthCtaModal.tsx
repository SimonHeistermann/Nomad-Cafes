import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { useAuthCta } from '@/contexts';
import '@/styles/components/ui/auth-cta-modal.css';

export const AuthCtaModal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOpen, reason, closeAuthCta } = useAuthCta();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management - focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeAuthCta();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeAuthCta]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignup = () => {
    closeAuthCta();
    navigate('/register');
  };

  const handleLogin = () => {
    closeAuthCta();
    navigate('/login');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeAuthCta();
    }
  };

  if (!isOpen || !reason) {
    return null;
  }

  return (
    <div
      className="auth-cta-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-cta-title"
    >
      <div className="auth-cta-modal" ref={modalRef}>
        <button
          ref={closeButtonRef}
          className="auth-cta-close"
          onClick={closeAuthCta}
          aria-label="Close"
          type="button"
        >
          <FiX />
        </button>

        <div className="auth-cta-content">
          <h2 id="auth-cta-title" className="auth-cta-title">
            {t('auth.authCta.title')}
          </h2>
          <p className="auth-cta-body">
            {t(`auth.authCta.body.${reason}`)}
          </p>
        </div>

        <div className="auth-cta-actions">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSignup}
          >
            {t('auth.authCta.actions.signup')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleLogin}
          >
            {t('auth.authCta.actions.login')}
          </Button>
          <button
            className="auth-cta-later"
            onClick={closeAuthCta}
            type="button"
          >
            {t('auth.authCta.actions.later')}
          </button>
        </div>
      </div>
    </div>
  );
};
