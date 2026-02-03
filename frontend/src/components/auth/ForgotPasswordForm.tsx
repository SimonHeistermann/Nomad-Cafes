import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Honeypot } from '@/components/ui/Honeypot';
import { FiMail, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { containsXssPatterns, sanitizeInput } from '@/lib/utils/sanitize';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';
import '@/styles/components/forms/auth-forms.css';

export interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean }>({});

  const validateField = (field: 'email', value: string): string | undefined => {
    if (field === 'email') {
      if (!value) {
        return t('auth.forgotPassword.errors.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return t('auth.forgotPassword.errors.emailInvalid');
      } else if (containsXssPatterns(value)) {
        return t('auth.forgotPassword.errors.sendFailed');
      }
    }

    return undefined;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailError = validateField('email', email);

    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    setTouched({ email: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'email') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, email);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      const error = validateField('email', value);
      setErrors((prev) => ({ ...prev, email: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check honeypot (bot detection)
    if (honeypot) {
      // Silently reject - likely a bot
      return;
    }

    if (!validateForm()) return;

    try {
      // Sanitize input before sending
      const sanitizedEmail = sanitizeInput(email);

      await onSubmit(sanitizedEmail);
      setIsSubmitted(true);
    } catch (error) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx) → inline form error
      if (isServerError(error)) {
        showError(getServerErrorMessage(error));
      } else {
        setErrors({
          form: getErrorMessage(error),
        });
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-form">
        <div className="auth-form-header">
          <div className="auth-form-success-icon">
            <FiCheckCircle size={48} />
          </div>
          <h1 className="auth-form-title">{t('auth.forgotPassword.successTitle')}</h1>
          <p className="auth-form-subtitle">
            {t('auth.forgotPassword.successMessage')} <strong>{email}</strong>
          </p>
        </div>

        <div className="auth-form-info">
          <p>{t('auth.forgotPassword.successInfo')}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => setIsSubmitted(false)}
        >
          {t('auth.forgotPassword.tryAnotherEmail')}
        </Button>

        {onBack && (
          <button
            type="button"
            className="auth-form-back-button"
            onClick={onBack}
          >
            <FiArrowLeft />
            {t('auth.forgotPassword.backToLogin')}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <div className="auth-form-header">
        <h1 className="auth-form-title">{t('auth.forgotPassword.title')}</h1>
        <p className="auth-form-subtitle">
          {t('auth.forgotPassword.subtitle')}
        </p>
      </div>

      {errors.form && (
        <div className="auth-form-error" role="alert">
          <FiAlertCircle />
          <span>{errors.form}</span>
        </div>
      )}

      <div className="auth-form-fields">
        <TextInput
          label={t('auth.forgotPassword.emailLabel')}
          type="email"
          placeholder={t('auth.forgotPassword.emailPlaceholder')}
          value={email}
          onChange={handleEmailChange}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : undefined}
          leftIcon={<FiMail />}
          required
          disabled={isLoading}
          autoComplete="email"
          autoFocus
        />
      </div>

      <Honeypot value={honeypot} onChange={setHoneypot} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {t('auth.forgotPassword.sendResetButton')}
      </Button>

      {onBack && (
        <button
          type="button"
          className="auth-form-back-button"
          onClick={onBack}
          disabled={isLoading}
        >
          <FiArrowLeft />
          {t('auth.forgotPassword.backToLogin')}
        </button>
      )}
    </form>
  );
};
