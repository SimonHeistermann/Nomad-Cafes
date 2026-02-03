import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { FiUser, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { authApi } from '@/api/auth';
import { sanitizeInput, containsXssPatterns } from '@/lib/utils/sanitize';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentBio?: string;
  onProfileUpdated: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentBio = '',
  onProfileUpdated,
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens with new values
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setBio(currentBio);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, currentName, currentBio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate name
    if (!name.trim()) {
      setError(t('account.editProfile.errors.nameRequired'));
      return;
    }

    if (name.trim().length < 2) {
      setError(t('account.editProfile.errors.nameTooShort'));
      return;
    }

    if (containsXssPatterns(name) || containsXssPatterns(bio)) {
      setError(t('account.editProfile.errors.invalidInput'));
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedName = sanitizeInput(name.trim());
      const sanitizedBio = sanitizeInput(bio.trim());
      await authApi.updateProfile({ name: sanitizedName, bio: sanitizedBio });
      setSuccess(true);
      onProfileUpdated();

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err) {
      // Server errors (5xx, network) → Toast notification
      // User errors (4xx) → inline form error
      if (isServerError(err)) {
        showError(getServerErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName(currentName);
    setBio(currentBio);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('account.editProfile.title')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="modal-error" role="alert">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="modal-success" role="status">
            <FiCheckCircle />
            <span>{t('account.editProfile.success')}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <TextInput
            label={t('account.editProfile.nameLabel')}
            type="text"
            placeholder={t('account.editProfile.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<FiUser />}
            required
            disabled={isLoading || success}
            autoComplete="name"
          />

          <div className="text-input-wrapper">
            <label htmlFor="bio-input" className="text-input-label">
              {t('account.editProfile.bioLabel')}
            </label>
            <textarea
              id="bio-input"
              className="text-input"
              placeholder={t('account.editProfile.bioPlaceholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLoading || success}
              rows={3}
              maxLength={500}
              style={{
                resize: 'vertical',
                minHeight: '80px',
                fontFamily: 'inherit',
              }}
            />
            <div className="text-input-message-slot">
              <p className="text-input-helper">
                {bio.length}/500 {t('account.editProfile.bioHelper')}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={success}
          >
            {t('account.editProfile.saveButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
