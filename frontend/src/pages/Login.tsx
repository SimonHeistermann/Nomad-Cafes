import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { useAuth } from '@/contexts';

const LoginContent: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    await login({ email, password });
    navigate('/');
  };

  return (
    <main className="app-container" style={{ padding: '120px 0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoginForm
        onSubmit={handleLogin}
        onForgotPassword={() => navigate('/forgot-password')}
        onRegister={() => navigate('/register')}
      />
    </main>
  );
};

const Login: React.FC = () => (
  <FeatureErrorBoundary feature="login">
    <LoginContent />
  </FeatureErrorBoundary>
);

export default Login;
