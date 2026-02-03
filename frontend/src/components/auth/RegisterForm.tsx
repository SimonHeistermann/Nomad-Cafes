import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from '@/components/ui/TextInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Honeypot } from '@/components/ui/Honeypot';
import { FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { containsXssPatterns, sanitizeInput } from '@/lib/utils/sanitize';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';
import '@/styles/components/forms/auth-forms.css';

export interface RegisterFormProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  onLogin?: () => void;
  isLoading?: boolean;
}

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword';

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onLogin,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const validateField = (field: FieldName, value: string, currentPassword?: string): string | undefined => {
    if (field === 'name') {
      if (!value) {
        return t('auth.register.errors.nameRequired');
      } else if (value.length < 2) {
        return t('auth.register.errors.nameTooShort');
      } else if (containsXssPatterns(value)) {
        return t('auth.register.errors.registrationFailed');
      }
    }

    if (field === 'email') {
      if (!value) {
        return t('auth.register.errors.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return t('auth.register.errors.emailInvalid');
      } else if (containsXssPatterns(value)) {
        return t('auth.register.errors.registrationFailed');
      }
    }

    if (field === 'password') {
      if (!value) {
        return t('auth.register.errors.passwordRequired');
      } else if (value.length < 8) {
        return t('auth.register.errors.passwordTooShort');
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return t('auth.register.errors.passwordWeak');
      } else if (containsXssPatterns(value)) {
        return t('auth.register.errors.registrationFailed');
      }
    }

    if (field === 'confirmPassword') {
      if (!value) {
        return t('auth.register.errors.confirmPasswordRequired');
      } else if (currentPassword && value !== currentPassword) {
        return t('auth.register.errors.passwordsNoMatch');
      }
    }

    return undefined;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const nameError = validateField('name', name);
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    const confirmPasswordError = validateField('confirmPassword', confirmPassword, password);

    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'name' ? name : field === 'email' ? email : field === 'password' ? password : confirmPassword;
    const error = validateField(field, value, field === 'confirmPassword' ? password : undefined);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      const error = validateField('name', value);
      setErrors((prev) => ({ ...prev, name: error }));
    }
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

    // Check honeypot (bot detection)
    if (honeypot) {
      // Silently reject - likely a bot
      return;
    }

    if (!validateForm()) return;

    try {
      // Sanitize name and email, but NOT password
      // Password sanitization would break auth (e.g., & becomes &amp;)
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);

      await onSubmit(sanitizedName, sanitizedEmail, password);
    } catch (error) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx like validation) → inline form error
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
        <h1 className="auth-form-title">{t('auth.register.title')}</h1>
        <p className="auth-form-subtitle">{t('auth.register.subtitle')}</p>
      </div>

      {errors.form && (
        <div className="auth-form-error" role="alert">
          <FiAlertCircle />
          <span>{errors.form}</span>
        </div>
      )}

      <div className="auth-form-fields">
        <TextInput
          label={t('auth.register.nameLabel')}
          type="text"
          placeholder={t('auth.register.namePlaceholder')}
          value={name}
          onChange={handleNameChange}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : undefined}
          leftIcon={<FiUser />}
          required
          disabled={isLoading}
          autoComplete="name"
        />

        <TextInput
          label={t('auth.register.emailLabel')}
          type="email"
          placeholder={t('auth.register.emailPlaceholder')}
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
          label={t('auth.register.passwordLabel')}
          placeholder={t('auth.register.passwordPlaceholder')}
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : undefined}
          helperText={t('auth.register.passwordHelper')}
          leftIcon={<FiLock />}
          required
          disabled={isLoading}
          autoComplete="new-password"
        />

        <PasswordInput
          label={t('auth.register.confirmPasswordLabel')}
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
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

      <Honeypot value={honeypot} onChange={setHoneypot} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {t('auth.register.createAccountButton')}
      </Button>

      {onLogin && (
        <p className="auth-form-footer">
          {t('auth.register.hasAccount')}{' '}
          <button
            type="button"
            className="auth-form-link"
            onClick={onLogin}
            disabled={isLoading}
          >
            {t('auth.register.signInLink')}
          </button>
        </p>
      )}
    </form>
  );
};
