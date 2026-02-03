import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMail, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import '@/styles/components/forms/auth-forms.css';

export interface EmailVerificationFormProps {
  /** Email address to verify */
  email?: string;
  /** Verification token from URL */
  token?: string;
  /** Function to verify email with token */
  onVerify?: (token: string) => Promise<void>;
  /** Function to resend verification email */
  onResendEmail?: (email: string) => Promise<void>;
  /** Callback when user clicks "Go to Login" */
  onGoToLogin?: () => void;
  /** Callback when user clicks "Go to Dashboard" (after successful verification) */
  onGoToDashboard?: () => void;
  /** Loading state */
  isLoading?: boolean;
}

type VerificationStatus = 'pending' | 'verifying' | 'success' | 'error';

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  email,
  token,
  onVerify,
  onResendEmail,
  onGoToLogin,
  onGoToDashboard,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  // Auto-verify if token is provided
  useEffect(() => {
    if (token && onVerify && status === 'pending') {
      setStatus('verifying');
      setError('');

      onVerify(token)
        .then(() => {
          setStatus('success');
        })
        .catch((err) => {
          setStatus('error');
          setError(getErrorMessage(err));
        });
    }
  }, [token, onVerify, status, t]);

  const handleResend = async () => {
    if (!email || !onResendEmail) return;

    setResending(true);
    setError('');

    try {
      await onResendEmail(email);
      setStatus('pending');
      // Could show a success toast here
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  // Show verifying state
  if (status === 'verifying') {
    return (
      <div className="auth-form">
        <div className="auth-form-icon">
          <FiLoader size={48} className="auth-form-icon-spin" />
        </div>

        <h1 className="auth-form-title">
          {t('auth.verifyEmail.verifyingTitle')}
        </h1>

        <p className="auth-form-subtitle">
          {t('auth.verifyEmail.verifyingMessage')}
        </p>
      </div>
    );
  }

  // Show success state
  if (status === 'success') {
    return (
      <div className="auth-form">
        <div className="auth-form-icon auth-form-icon--success">
          <FiCheckCircle size={48} />
        </div>

        <h1 className="auth-form-title">
          {t('auth.verifyEmail.successTitle')}
        </h1>

        <p className="auth-form-subtitle">
          {t('auth.verifyEmail.successMessage')}
        </p>

        <div className="auth-form-actions" style={{ marginTop: '2rem' }}>
          {onGoToDashboard && (
            <Button
              onClick={onGoToDashboard}
              variant="primary"
              fullWidth
            >
              {t('auth.verifyEmail.goToDashboard')}
            </Button>
          )}

          {onGoToLogin && (
            <Button
              onClick={onGoToLogin}
              variant={onGoToDashboard ? 'secondary' : 'primary'}
              fullWidth
            >
              {t('auth.verifyEmail.goToLogin')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (status === 'error') {
    return (
      <div className="auth-form">
        <div className="auth-form-icon auth-form-icon--error">
          <FiAlertCircle size={48} />
        </div>

        <h1 className="auth-form-title">
          {t('auth.verifyEmail.errors.verificationFailed')}
        </h1>

        {error && (
          <p className="auth-form-error" role="alert">
            {error}
          </p>
        )}

        <div className="auth-form-actions" style={{ marginTop: '2rem' }}>
          {email && onResendEmail && (
            <Button
              onClick={handleResend}
              isLoading={resending}
              variant="primary"
              fullWidth
            >
              {t('auth.verifyEmail.resendButton')}
            </Button>
          )}

          {onGoToLogin && (
            <Button
              onClick={onGoToLogin}
              variant="secondary"
              fullWidth
            >
              {t('auth.verifyEmail.backToLogin')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show pending state (waiting for email verification)
  return (
    <div className="auth-form">
      <div className="auth-form-icon">
        <FiMail size={48} />
      </div>

      <h1 className="auth-form-title">
        {t('auth.verifyEmail.checkEmailTitle')}
      </h1>

      {email && (
        <p className="auth-form-subtitle">
          {t('auth.verifyEmail.checkEmailMessage')} <strong>{email}</strong>
        </p>
      )}

      <p className="auth-form-info">
        {t('auth.verifyEmail.checkEmailInfo')}
      </p>

      {error && (
        <p className="auth-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="auth-form-actions" style={{ marginTop: '2rem' }}>
        {email && onResendEmail && (
          <div className="auth-form-help">
            <span>{t('auth.verifyEmail.didntReceive')} </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || isLoading}
              className="auth-form-link"
            >
              {resending
                ? t('common.loading')
                : t('auth.verifyEmail.resendLink')}
            </button>
          </div>
        )}

        {onGoToLogin && (
          <Button
            onClick={onGoToLogin}
            variant="secondary"
            fullWidth
          >
            {t('auth.verifyEmail.backToLogin')}
          </Button>
        )}
      </div>
    </div>
  );
};
