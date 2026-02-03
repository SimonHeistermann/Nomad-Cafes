import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { api } from '@/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (password: string, resetToken: string) => {
    await api.auth.resetPassword({ password, token: resetToken });
  };

  return (
    <main
      className="app-container"
      style={{
        padding: '120px 0',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ResetPasswordForm
        onSubmit={handleSubmit}
        onGoToLogin={() => navigate('/login')}
        token={token || undefined}
      />
    </main>
  );
};

export default ResetPassword;
