import React, { useState, useRef, useEffect } from 'react';
import { motion as MOTION, AnimatePresence } from 'framer-motion';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';

import {
  FiChevronDown,
  FiHeart,
  FiMessageSquare,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';

import '@/styles/layout/layout.css';
import '@/styles/components/navigation/header.css';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import type {
  HeaderProps,
  HeaderUser,
} from '@/types/header';

type HeaderUserMenuProps = {
  user: HeaderUser;
};

type NavItem = {
  id: string;
  translationKey: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home', translationKey: 'header.home', href: '/' },
  { id: 'explore', translationKey: 'header.explore', href: '/explore' },
  { id: 'about', translationKey: 'header.about', href: '/about' },
];

const DEFAULT_USER: HeaderUser = {
  name: 'Cameron Williamson',
  avatarUrl: null,
};

const Header: React.FC<HeaderProps> = ({
  variant = 'solid',
  isAuthenticated = false,
  user = DEFAULT_USER,
}) => {
  const { t } = useTranslation();
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (variant !== 'transparent') return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  const variantClass =
    variant === 'transparent'
      ? isScrolled
        ? 'site-header--glass'
        : 'site-header--transparent'
      : 'site-header--solid';

  return (
    <header
      className={`site-header ${variantClass}`}
    >
      <div className="app-container header-inner">
        {/* LEFT SIDE — Logo & Nav */}
        <div className="header-left">
          <Link
            to="/"
            className="header-logo"
            aria-label="Nomad Cafes – Home"
          >
            <span
              className="header-logo-mark"
              aria-hidden="true"
            >
              N
            </span>
            <span className="header-logo-text">
              Nomad Cafes
            </span>
          </Link>

          <nav
            className="header-nav"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              const isHovered = hoveredNav === item.id;

              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className="header-nav-link"
                  onMouseEnter={() => setHoveredNav(item.id)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  <span
                    className={
                      isActive
                        ? 'header-nav-label active'
                        : 'header-nav-label'
                    }
                  >
                    {t(item.translationKey)}
                  </span>

                  <MOTION.span
                    className="header-nav-underline"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        isActive || isHovered ? '100%' : '0%',
                    }}
                    transition={{
                      duration: 0.25,
                      ease: [0.25, 0.8, 0.25, 1],
                    }}
                  />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* RIGHT SIDE — Auth / User Menu */}
        <div className="header-right">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <HeaderUserMenu user={user} />
          ) : (
            <>
              <NavLink to="/login" className="btn-text">
                {t('header.login')}
              </NavLink>
              <NavLink to="/register" className="btn-primary">
                {t('header.signup')}
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const HeaderUserMenu: React.FC<HeaderUserMenuProps> = ({
  user,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter((part) => part.length > 0)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'N'
    : 'N';

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const toggleMenu = () =>
    setIsOpen((prev) => !prev);

  return (
    <div className="header-user" ref={menuRef}>
      <button
        type="button"
        className="header-user-button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="header-user-avatar">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
            />
          ) : (
            <span aria-hidden="true">
              {initials}
            </span>
          )}
        </div>
        <span className="header-user-name">
          {user?.name}
        </span>
        <FiChevronDown
          className="header-user-chevron"
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <MOTION.div
            className="header-user-menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="menu"
          >
            <NavLink
              to="/favorites"
              className="header-user-menu-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <FiHeart className="header-user-menu-icon" />
              <span>{t('header.favorites')}</span>
            </NavLink>

            <NavLink
              to="/my-reviews"
              className="header-user-menu-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <FiMessageSquare className="header-user-menu-icon" />
              <span>{t('header.myReviews')}</span>
            </NavLink>

            <NavLink
              to="/account"
              className="header-user-menu-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <FiUser className="header-user-menu-icon" />
              <span>{t('header.account')}</span>
            </NavLink>

            <div className="header-user-menu-divider" />

            <button
              type="button"
              className="header-user-menu-item header-user-menu-item--danger"
              onClick={async () => {
                setIsOpen(false);
                await logout();
                navigate('/');
              }}
              role="menuitem"
            >
              <FiLogOut className="header-user-menu-icon" />
              <span>{t('header.logout')}</span>
            </button>
          </MOTION.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
