import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { authApi } from '@/api/auth';
import { containsXssPatterns } from '@/lib/utils/sanitize';
import { getErrorMessage, isServerError, getServerErrorMessage } from '@/lib/utils/errorHandler';
import { useToast } from '@/contexts';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate
    if (!currentPassword) {
      setError(t('account.changePassword.errors.currentRequired'));
      return;
    }

    if (!newPassword) {
      setError(t('account.changePassword.errors.newRequired'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('account.changePassword.errors.newTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('account.changePassword.errors.mismatch'));
      return;
    }

    if (containsXssPatterns(currentPassword) || containsXssPatterns(newPassword)) {
      setError(t('account.changePassword.errors.invalidInput'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);

      // Close modal after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
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
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('account.changePassword.title')}
      size="sm"
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
            <span>{t('account.changePassword.success')}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
          <PasswordInput
            label={t('account.changePassword.currentLabel')}
            placeholder={t('account.changePassword.currentPlaceholder')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<FiLock />}
            required
            disabled={isLoading || success}
            autoComplete="current-password"
          />

          <PasswordInput
            label={t('account.changePassword.newLabel')}
            placeholder={t('account.changePassword.newPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<FiLock />}
            required
            disabled={isLoading || success}
            autoComplete="new-password"
            helperText={t('account.changePassword.newHelper')}
          />

          <PasswordInput
            label={t('account.changePassword.confirmLabel')}
            placeholder={t('account.changePassword.confirmPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<FiLock />}
            required
            disabled={isLoading || success}
            autoComplete="new-password"
          />
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
            {t('account.changePassword.saveButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
