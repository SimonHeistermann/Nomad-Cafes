import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmailVerificationForm } from '@/components/auth/EmailVerificationForm';
import { api } from '@/api';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleVerify = async (verificationToken: string) => {
    await api.auth.verifyEmail(verificationToken);
  };

  const handleResendEmail = async (emailAddress: string) => {
    await api.auth.resendVerification(emailAddress);
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    navigate('/account');
  };

  return (
    <main
      className="app-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 0',
        minHeight: '100vh',
      }}
    >
      <EmailVerificationForm
        email={email || undefined}
        token={token || undefined}
        onVerify={handleVerify}
        onResendEmail={handleResendEmail}
        onGoToLogin={handleGoToLogin}
        onGoToDashboard={handleGoToDashboard}
      />
    </main>
  );
};

export default VerifyEmail;
