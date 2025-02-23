'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';
import Link from 'next/link';
import { HiHome, HiMenu, HiOutlineUser, HiOutlineLogout, HiTranslate, HiCheck, HiPlus } from 'react-icons/hi';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const Header = (): JSX.Element => {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, isLoading } = useUser();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const navigationItems = [
    { 
      icon: <HiPlus className="w-5 h-5" />, 
      name: t('Create'), 
      href: '/create',
      primary: true 
    }
  ];

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    } else {
      i18n.changeLanguage('pt');
      localStorage.setItem('preferredLanguage', 'pt');
    }
  }, [i18n]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('preferredLanguage', lng);
    setProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    router.push(`/api/auth/logout?returnTo=${encodeURIComponent(window.location.origin)}&federated=true`);
  };

  return (
    <header className={`fixed top-0 w-screen z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-neutral-light shadow-md border-b border-secondary-light' 
        : 'bg-neutral-light/80 backdrop-blur-sm'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo and Slogan */}
          <Link href="/" className="flex items-center space-x-4">
            <div className="flex items-center">
              <Image
                src="/m_transparent.png"
                alt="Memora logo"
                width={32}
                height={32}
                priority
                className="object-contain"
              />
              <span className="ml-2 text-xl font-semibold text-primary">
                Memoras
              </span>
            </div>
            <span className="hidden md:block text-sm font-medium text-neutral-dark/60 italic border-l border-secondary-light pl-4">
              Eternalize yourself.
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center ml-8">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  window.location.href = item.href;
                }}
                className={`flex items-center space-x-2 px-6 py-2.5 text-base font-medium rounded-lg transition-all duration-200 ${
                  item.primary
                    ? 'bg-primary text-neutral-light hover:bg-primary/90'
                    : 'text-neutral-dark/70 hover:text-neutral-dark hover:bg-secondary-light'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Push user menu to the right */}
          <div className="flex-1" />

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full animate-pulse bg-secondary-light" />
            ) : !user ? (
              <Link
                href="/api/auth/login"
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors bg-primary text-neutral-light hover:bg-primary/90"
              >
                {t('header.auth.signIn', 'Sign In')}
              </Link>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="relative"
                >
                  <img
                    src={user.picture || '/placeholder-avatar.png'}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-secondary hover:ring-primary transition-all"
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-light rounded-lg shadow-lg py-1 border border-secondary-light">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-neutral-dark hover:bg-secondary-light transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <HiOutlineUser className="mr-2 h-4 w-4" />
                      {t('header.auth.profile.editProfile', 'Edit profile')}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-secondary-light"
                    >
                      <HiOutlineLogout className="mr-2 h-4 w-4" />
                      {t('header.auth.profile.logout', 'Logout')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-neutral-dark/70 hover:text-neutral-dark"
            >
              <HiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-neutral-light shadow-lg border-t border-secondary-light">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  window.location.href = item.href;
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
                  item.primary
                    ? 'bg-primary text-neutral-light hover:bg-primary/90'
                    : 'text-neutral-dark/70 hover:text-neutral-dark hover:bg-secondary-light'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;