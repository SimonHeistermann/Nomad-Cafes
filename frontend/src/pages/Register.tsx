import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { useAuth } from '@/contexts';

const RegisterContent: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (name: string, email: string, password: string) => {
    await register({ name, email, password });
    navigate('/');
  };

  return (
    <main className="app-container" style={{ padding: '120px 0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RegisterForm
        onSubmit={handleRegister}
        onLogin={() => navigate('/login')}
      />
    </main>
  );
};

const Register: React.FC = () => (
  <FeatureErrorBoundary feature="register">
    <RegisterContent />
  </FeatureErrorBoundary>
);

export default Register;
