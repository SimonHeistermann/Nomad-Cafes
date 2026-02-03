import React from 'react';
import Header from './Header';
import Footer from './Footer';

import '@/styles/layout/layout.css';
import type {
  HeaderVariant,
  HeaderUser,
} from '@/types/header';

type LayoutProps = {
  children: React.ReactNode;
  headerVariant?: HeaderVariant;
  isAuthenticated?: boolean;
  user?: HeaderUser;
  hideFooter?: boolean; // Allow pages to hide the default footer
};

const Layout: React.FC<LayoutProps> = ({
  children,
  headerVariant = 'solid',
  isAuthenticated = false,
  user,
  hideFooter = false,
}) => {
  return (
    <div className="app-shell">
      <Header
        variant={headerVariant}
        isAuthenticated={isAuthenticated}
        user={user}
      />
      <main className="app-main">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;