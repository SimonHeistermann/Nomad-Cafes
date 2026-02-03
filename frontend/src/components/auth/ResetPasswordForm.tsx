import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';
import '@/styles/components/forms/auth-forms.css';

export interface ResetPasswordFormProps {
  onSubmit: (password: string, token: string) => Promise<void>;
  onGoToLogin?: () => void;
  token?: string;
  isLoading?: boolean;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  onGoToLogin,
  token,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({});

  const validateField = (field: 'password' | 'confirmPassword', value: string, currentPassword?: string): string | undefined => {
    if (field === 'password') {
      if (!value) {
        return t('auth.resetPassword.errors.passwordRequired');
      } else if (value.length < 8) {
        return t('auth.resetPassword.errors.passwordTooShort');
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return t('auth.resetPassword.errors.passwordWeak');
      }
    }

    if (field === 'confirmPassword') {
      if (!value) {
        return t('auth.resetPassword.errors.confirmPasswordRequired');
      } else if (currentPassword && value !== currentPassword) {
        return t('auth.resetPassword.errors.passwordsNoMatch');
      }
    }

    return undefined;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const passwordError = validateField('password', password);
    const confirmPasswordError = validateField('confirmPassword', confirmPassword, password);

    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    setTouched({ password: true, confirmPassword: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'password' ? password : confirmPassword;
    const error = validateField(field, value, field === 'confirmPassword' ? password : undefined);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      const error = validateField('password', value);
      setErrors((prev) => ({ ...prev, password: error }));
    }
    // Also re-validate confirmPassword if it's been touched
    if (touched.confirmPassword && confirmPassword) {
      const confirmError = validateField('confirmPassword', confirmPassword, value);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const error = validateField('confirmPassword', value, password);
      setErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ form: t('auth.resetPassword.errors.tokenRequired') });
      return;
    }

    if (!validateForm()) return;

    try {
      await onSubmit(password, token);
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
          <h1 className="auth-form-title">{t('auth.resetPassword.successTitle')}</h1>
          <p className="auth-form-subtitle">
            {t('auth.resetPassword.successMessage')}
          </p>
        </div>

        {onGoToLogin && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onGoToLogin}
          >
            {t('auth.resetPassword.goToLogin')}
          </Button>
        )}
      </div>
    );
  }

  // Show error if token is missing
  if (!token) {
    return (
      <div className="auth-form">
        <div className="auth-form-header">
          <h1 className="auth-form-title">{t('auth.resetPassword.title')}</h1>
        </div>

        <div className="auth-form-error" role="alert">
          <FiAlertCircle />
          <span>{t('auth.resetPassword.errors.invalidToken')}</span>
        </div>

        {onGoToLogin && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onGoToLogin}
          >
            {t('auth.resetPassword.backToLogin')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <div className="auth-form-header">
        <h1 className="auth-form-title">{t('auth.resetPassword.title')}</h1>
        <p className="auth-form-subtitle">
          {t('auth.resetPassword.subtitle')}
        </p>
      </div>

      {errors.form && (
        <div className="auth-form-error" role="alert">
          <FiAlertCircle />
          <span>{errors.form}</span>
        </div>
      )}

      <div className="auth-form-fields">
        <PasswordInput
          label={t('auth.resetPassword.passwordLabel')}
          placeholder={t('auth.resetPassword.passwordPlaceholder')}
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : undefined}
          helperText={t('auth.resetPassword.passwordHelper')}
          leftIcon={<FiLock />}
          required
          disabled={isLoading}
          autoComplete="new-password"
          autoFocus
        />

        <PasswordInput
          label={t('auth.resetPassword.confirmPasswordLabel')}
          placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          leftIcon={<FiLock />}
          required
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {t('auth.resetPassword.resetButton')}
      </Button>

      {onGoToLogin && (
        <p className="auth-form-footer">
          <button
            type="button"
            className="auth-form-link"
            onClick={onGoToLogin}
            disabled={isLoading}
          >
            {t('auth.resetPassword.backToLogin')}
          </button>
        </p>
      )}
    </form>
  );
};