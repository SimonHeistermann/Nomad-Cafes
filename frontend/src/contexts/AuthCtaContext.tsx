import React, { createContext, useContext, useState, useCallback } from 'react';

export type AuthCtaReason = 'favorite' | 'review';

interface AuthCtaContextType {
  isOpen: boolean;
  reason: AuthCtaReason | null;
  openAuthCta: (reason: AuthCtaReason) => void;
  closeAuthCta: () => void;
}

const AuthCtaContext = createContext<AuthCtaContextType | undefined>(undefined);

export const AuthCtaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<AuthCtaReason | null>(null);

  const openAuthCta = useCallback((newReason: AuthCtaReason) => {
    setReason(newReason);
    setIsOpen(true);
  }, []);

  const closeAuthCta = useCallback(() => {
    setIsOpen(false);
    // Delay clearing reason to allow exit animation
    setTimeout(() => setReason(null), 200);
  }, []);

  const value: AuthCtaContextType = {
    isOpen,
    reason,
    openAuthCta,
    closeAuthCta,
  };

  return <AuthCtaContext.Provider value={value}>{children}</AuthCtaContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthCta = (): AuthCtaContextType => {
  const context = useContext(AuthCtaContext);
  if (context === undefined) {
    throw new Error('useAuthCta must be used within an AuthCtaProvider');
  }
  return context;
};
