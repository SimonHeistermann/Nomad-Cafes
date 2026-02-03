import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { api } from '@/api';

const ForgotPasswordContent: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (email: string) => {
    await api.auth.requestPasswordReset({ email });
  };

  return (
    <main className="app-container" style={{ padding: '120px 0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ForgotPasswordForm
        onSubmit={handleSubmit}
        onBack={() => navigate('/login')}
      />
    </main>
  );
};

const ForgotPassword: React.FC = () => (
  <FeatureErrorBoundary feature="forgotPassword">
    <ForgotPasswordContent />
  </FeatureErrorBoundary>
);

export default ForgotPassword;
