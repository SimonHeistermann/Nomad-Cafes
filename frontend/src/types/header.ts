export type HeaderVariant = 'transparent' | 'solid';

export type HeaderUser = {
  name: string;
  avatarUrl: string | null;
};

export type HeaderProps = {
  variant?: HeaderVariant;
  isAuthenticated?: boolean;
  user?: HeaderUser;
};