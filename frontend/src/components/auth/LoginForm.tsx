import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from '@/components/ui/TextInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Honeypot } from '@/components/ui/Honeypot';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { containsXssPatterns, sanitizeInput } from '@/lib/utils/sanitize';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';
import '@/styles/components/forms/auth-forms.css';

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onRegister,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const validateField = (field: 'email' | 'password', value: string): string | undefined => {
    if (field === 'email') {
      if (!value) {
        return t('auth.login.errors.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return t('auth.login.errors.emailInvalid');
      } else if (containsXssPatterns(value)) {
        return t('auth.login.errors.loginFailed');
      }
    }

    if (field === 'password') {
      if (!value) {
        return t('auth.login.errors.passwordRequired');
      } else if (value.length < 6) {
        return t('auth.login.errors.passwordTooShort');
      } else if (containsXssPatterns(value)) {
        return t('auth.login.errors.loginFailed');
      }
    }

    return undefined;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    const error = validateField(field, value);
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      const error = validateField('password', value);
      setErrors((prev) => ({ ...prev, password: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot (bot detection)
    if (honeypot) {
      // Silently reject - likely a bot
      return;
    }

    if (!validateForm()) return;

    try {
      // Sanitize email only - passwords must be sent as-is for authentication
      // Password sanitization would break auth (e.g., & becomes &amp;)
      const sanitizedEmail = sanitizeInput(email);

      await onSubmit(sanitizedEmail, password);
    } catch (error) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx like invalid credentials) → inline form error
      if (isServerError(error)) {
        showError(getServerErrorMessage(error));
      } else {
        setErrors({
          form: getErrorMessage(error),
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <div className="auth-form-header">
        <h1 className="auth-form-title">{t('auth.login.title')}</h1>
        <p className="auth-form-subtitle">{t('auth.login.subtitle')}</p>
      </div>

      {/* Always render error slot to prevent layout shift */}
      <div
        className={`auth-form-error-slot ${errors.form ? 'auth-form-error-slot--visible' : ''}`}
        role={errors.form ? "alert" : undefined}
        aria-live="polite"
      >
        {errors.form && (
          <>
            <FiAlertCircle />
            <span>{errors.form}</span>
          </>
        )}
      </div>

      <div className="auth-form-fields">
        <TextInput
          label={t('auth.login.emailLabel')}
          type="email"
          placeholder={t('auth.login.emailPlaceholder')}
          value={email}
          onChange={handleEmailChange}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : undefined}
          leftIcon={<FiMail />}
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <PasswordInput
          label={t('auth.login.passwordLabel')}
          placeholder={t('auth.login.passwordPlaceholder')}
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : undefined}
          leftIcon={<FiLock />}
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        {onForgotPassword && (
          <button
            type="button"
            className="auth-form-link auth-form-link--right"
            onClick={onForgotPassword}
            disabled={isLoading}
          >
            {t('auth.login.forgotPassword')}
          </button>
        )}
      </div>

      <Honeypot value={honeypot} onChange={setHoneypot} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {t('auth.login.signInButton')}
      </Button>

      {onRegister && (
        <p className="auth-form-footer">
          {t('auth.login.noAccount')}{' '}
          <button
            type="button"
            className="auth-form-link"
            onClick={onRegister}
            disabled={isLoading}
          >
            {t('auth.login.signUpLink')}
          </button>
        </p>
      )}
    </form>
  );
};
