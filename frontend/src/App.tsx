import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Layout from '@/components/layout/Layout';
import AppRoutes from '@/routes/AppRoutes';
import { AuthProvider, useAuth, ToastProvider, AuthCtaProvider, FavoritesProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthCtaModal } from '@/components/ui/AuthCtaModal';

const LoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '1.25rem',
      color: '#6c757d'
    }}>
      {t('errors.loading')}
    </div>
  );
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Check if transition should be disabled (e.g., for search navigation)
  const disableTransition = (location.state as any)?.disableTransition === true;

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  const headerVariant =
    location.pathname === '/' ? 'transparent' : 'solid';

  // Hide default footer on homepage (uses integrated HomeFooter instead)
  const hideFooter = location.pathname === '/';

  const headerUser = user ? {
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
  } : undefined;

  return (
    <Layout
      headerVariant={headerVariant}
      isAuthenticated={isAuthenticated}
      user={headerUser}
      hideFooter={hideFooter}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={disableTransition ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={disableTransition ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={disableTransition ? { duration: 0 } : { duration: 0.2 }}
        >
          <AppRoutes />
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <FavoritesProvider>
                <AuthCtaProvider>
                  <AppShell />
                  <AuthCtaModal />
                </AuthCtaProvider>
              </FavoritesProvider>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;