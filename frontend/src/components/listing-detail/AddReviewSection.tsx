import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaLock } from 'react-icons/fa6';
import { Textarea } from '@/components/ui/Textarea';
import { Honeypot } from '@/components/ui/Honeypot';
import { Button } from '@/components/ui/Button';
import { containsXssPatterns, sanitizeInput } from '@/lib/utils/sanitize';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast, useAuth, useAuthCta } from '@/contexts';
import { reviewsApi } from '@/api/reviews';

type RatingKey = 'overall' | 'wifi' | 'power' | 'noise' | 'coffee';

export type AddReviewSectionProps = {
  cafeId: string;
  cafeSlug?: string;
  canSubmit?: boolean;
  onReviewSubmitted?: () => void;
};

export const AddReviewSection: React.FC<AddReviewSectionProps> = ({
  cafeId,
  cafeSlug,
  canSubmit = true,
  onReviewSubmitted,
}) => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const { isAuthenticated } = useAuth();
  const { openAuthCta } = useAuthCta();

  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    overall: 0,
    wifi: 0,
    power: 0,
    noise: 0,
    coffee: 0,
  });

  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{ content?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setRating = (key: RatingKey, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const validateField = (field: 'content', value: string): string | undefined => {
    if (field === 'content') {
      if (!value.trim()) {
        return t('forms.errors.reviewRequired');
      } else if (value.trim().length < 10) {
        return t('forms.errors.reviewTooShort');
      } else if (containsXssPatterns(value)) {
        return t('auth.login.errors.loginFailed'); // Generic error for XSS attempt
      }
    }

    return undefined;
  };

  const validateForm = (): boolean => {
    const contentError = validateField('content', content);

    // Check if overall rating has at least 1 star (other ratings are optional)
    const missingRatings: string[] = [];
    if (ratings.overall === 0) missingRatings.push(t('cafeDetail.reviewForm.overall'));

    if (contentError) {
      setError(contentError);
      setTouched({ content: true });
      return false;
    }

    if (missingRatings.length > 0) {
      setError(t('forms.errors.ratingRequired'));
      setTouched({ content: true });
      return false;
    }

    setError('');
    setTouched({ content: true });
    return true;
  };

  const handleBlur = (field: 'content') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, content);
    setError(err || '');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    if (touched.content) {
      const err = validateField('content', value);
      setError(err || '');
    }
  };

  const handleSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    // Auth check: backend enforces permission, frontend provides UX guard
    if (!isAuthenticated) {
      openAuthCta('review');
      return;
    }

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
      // Sanitize content before sending
      const sanitizedContent = sanitizeInput(content);

      // Submit review to API (using camelCase)
      await reviewsApi.createReview(cafeSlug || cafeId, {
        ratingOverall: ratings.overall,
        ratingWifi: ratings.wifi || undefined,
        ratingPower: ratings.power || undefined,
        ratingNoise: ratings.noise || undefined,
        ratingCoffee: ratings.coffee || undefined,
        text: sanitizedContent,
      });

      // Show success message
      showSuccess(t('cafeDetail.reviewSubmitted'));

      // Reset form
      setRatings({
        overall: 0,
        wifi: 0,
        power: 0,
        noise: 0,
        coffee: 0,
      });
      setContent('');
      setError('');
      setTouched({});

      // Notify parent to refetch reviews
      onReviewSubmitted?.();
    } catch (err: unknown) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx like already reviewed) → inline form error
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (key: RatingKey) => {
    const current = ratings[key];
    return (
      <div className="listing-rating-stars">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          const active = value <= current;
          return (
            <button
              key={value}
              type="button"
              className={
                'listing-rating-star' +
                (active ? ' listing-rating-star--active' : '')
              }
              onClick={() => canSubmit && setRating(key, value)}
            >
              ★
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <section
      className="listing-section listing-add-review-section"
      id="listing-detail-add-review"
    >
      <h2 className="listing-section-title">{t('cafeDetail.addReview')}</h2>

      <div
        className={
          'listing-add-review-wrapper' +
          (canSubmit ? '' : ' listing-add-review-wrapper--disabled')
        }
      >
        {!canSubmit && (
          <div className="listing-add-review-overlay">
            <FaLock className="listing-add-review-lock" />
            <p>{t('cafeDetail.signInToReview')}</p>
          </div>
        )}

        <form
          className="listing-add-review-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="listing-rating-grid">
            <div className="listing-rating-row">
              <span className="listing-rating-label">
                {t('cafeDetail.reviewForm.overall')}
              </span>
              {renderStars('overall')}
            </div>
            <div className="listing-rating-row">
              <span className="listing-rating-label">{t('cafeDetail.reviewForm.wifi')}</span>
              {renderStars('wifi')}
            </div>
            <div className="listing-rating-row">
              <span className="listing-rating-label">
                {t('cafeDetail.reviewForm.power')}
              </span>
              {renderStars('power')}
            </div>
            <div className="listing-rating-row">
              <span className="listing-rating-label">{t('cafeDetail.reviewForm.noise')}</span>
              {renderStars('noise')}
            </div>
            <div className="listing-rating-row">
              <span className="listing-rating-label">{t('cafeDetail.reviewForm.coffee')}</span>
              {renderStars('coffee')}
            </div>
          </div>

          <div className="listing-add-review-fields">
            <Textarea
              placeholder={t('cafeDetail.writeReviewPlaceholder')}
              value={content}
              onChange={handleContentChange}
              onBlur={() => handleBlur('content')}
              disabled={!canSubmit}
              error={touched.content ? error : undefined}
              maxHeight={200}
              required
            />
          </div>

          <Honeypot value={honeypot} onChange={setHoneypot} />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            {t('cafeDetail.sendReview')}
          </Button>
        </form>
      </div>
    </section>
  );
};
