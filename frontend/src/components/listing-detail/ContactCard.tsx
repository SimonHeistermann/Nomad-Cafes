import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from '@/components/ui/TextInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Textarea } from '@/components/ui/Textarea';
import { Honeypot } from '@/components/ui/Honeypot';
import { Button } from '@/components/ui/Button';
import {
  isValidEmail,
  isValidPhone,
  containsXssPatterns,
  sanitizeInput,
} from '@/lib/utils/sanitize';
import { isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';
import { api } from '@/api';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

type FieldName = 'name' | 'email' | 'phone' | 'message';

export const ContactCard: React.FC = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    phone: false,
    message: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: FieldName, value: string): string | undefined => {
    if (field === 'name') {
      if (!value.trim()) {
        return t('forms.errors.nameRequired');
      } else if (value.trim().length < 2) {
        return t('auth.register.errors.nameTooShort');
      } else if (containsXssPatterns(value)) {
        return t('forms.errors.invalidInput');
      }
    }

    if (field === 'email') {
      if (!value.trim()) {
        return t('forms.errors.emailRequired');
      } else if (!isValidEmail(value)) {
        return t('forms.errors.emailInvalid');
      } else if (containsXssPatterns(value)) {
        return t('forms.errors.invalidInput');
      }
    }

    if (field === 'phone') {
      if (!value.trim()) {
        return t('forms.errors.phoneRequired');
      } else if (!isValidPhone(value)) {
        return t('forms.errors.phoneInvalid');
      } else if (containsXssPatterns(value)) {
        return t('forms.errors.invalidInput');
      }
    }

    if (field === 'message') {
      if (!value.trim()) {
        return t('forms.errors.messageRequired');
      } else if (value.trim().length < 10) {
        return t('forms.errors.messageTooShort');
      } else if (containsXssPatterns(value)) {
        return t('forms.errors.invalidInput');
      }
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateField('name', name);
    const emailError = validateField('email', email);
    const phoneError = validateField('phone', phone);
    const messageError = validateField('message', message);

    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (phoneError) newErrors.phone = phoneError;
    if (messageError) newErrors.message = messageError;

    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, message: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'name' ? name : field === 'email' ? email : field === 'phone' ? phone : message;
    const error = validateField(field, value);
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (touched.phone) {
      const error = validateField('phone', value);
      setErrors((prev) => ({ ...prev, phone: error }));
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    if (touched.message) {
      const error = validateField('message', value);
      setErrors((prev) => ({ ...prev, message: error }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check honeypot (bot detection)
    if (honeypot) {
      // Silently reject - likely a bot
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize inputs before sending
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPhone = sanitizeInput(phone);
      const sanitizedMessage = sanitizeInput(message);

      // Build message with phone number included
      const fullMessage = sanitizedPhone
        ? `${sanitizedMessage}\n\n${t('contact.phonePrefix')}${sanitizedPhone}`
        : sanitizedMessage;

      // Send contact message via API
      await api.core.submitContact({
        name: sanitizedName,
        email: sanitizedEmail,
        subject: t('contact.subjectGeneral'),
        message: fullMessage,
      });

      // Show success message
      showSuccess(t('contact.messageSent'));

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setErrors({});
      setTouched({ name: false, email: false, phone: false, message: false });
    } catch (error: unknown) {
      // Show error via Toast (both server errors and user errors for now)
      // When API is implemented, 4xx errors could show inline validation errors
      if (isServerError(error)) {
        showError(getServerErrorMessage(error));
      } else {
        showError(t('errors.api.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="listing-card">
      <div className="listing-card-body">
        <h3 className="listing-card-title">{t('cafeDetail.contactBusiness')}</h3>

        <form className="listing-contact-form" onSubmit={handleSubmit} noValidate>
          <TextInput
            name="name"
            type="text"
            label={t('cafeDetail.namePlaceholder')}
            placeholder={t('cafeDetail.namePlaceholder')}
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur('name')}
            error={touched.name ? errors.name : undefined}
            required
          />

          <TextInput
            name="email"
            type="email"
            label={t('cafeDetail.emailPlaceholder')}
            placeholder={t('cafeDetail.emailPlaceholder')}
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            error={touched.email ? errors.email : undefined}
            required
          />

          <PhoneInput
            name="phone"
            label={t('cafeDetail.phonePlaceholder')}
            placeholder={t('cafeDetail.phonePlaceholder')}
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            error={touched.phone ? errors.phone : undefined}
            required
          />

          <Textarea
            name="message"
            label={t('cafeDetail.messagePlaceholder')}
            placeholder={t('cafeDetail.messagePlaceholder')}
            value={message}
            onChange={handleMessageChange}
            onBlur={() => handleBlur('message')}
            error={touched.message ? errors.message : undefined}
            maxHeight={200}
            required
          />

          <Honeypot value={honeypot} onChange={setHoneypot} />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
          >
            {t('cafeDetail.sendMessage')}
          </Button>
        </form>
      </div>
    </section>
  );
};
