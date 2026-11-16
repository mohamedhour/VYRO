import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, Menu, X, PackageSearch, UserRound } from 'lucide-react';
import { Locale, useLocale } from '../context/LocaleContext';

interface NavbarProps {
  activeSection: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  wishlistCount: number;
  cartCount: number;
  showWishlistOnly: boolean;
  onToggleWishlistFilter: () => void;
  onOpenCart: () => void;
  onOpenFitStudio: () => void;
  onTrackOrder: () => void;
  onOpenAccount: () => void;
  accountName?: string;
}

const NAV_LINKS = [
  { id: 'home', key: 'nav.home', href: '#home' },
  { id: 'shop', key: 'nav.shop', href: '#shop' },
  { id: 'try-on', key: 'nav.fit', href: '#try-on' },
  { id: 'about', key: 'nav.about', href: '#about' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  searchQuery,
  onSearchChange,
  wishlistCount,
  cartCount,
  showWishlistOnly,
  onToggleWishlistFilter,
  onOpenCart,
  onOpenFitStudio,
  onTrackOrder,
  onOpenAccount,
  accountName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const languageSwitch = (
    <div role="group" aria-label={t('nav.language')} className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] p-0.5">
      {(['fr', 'en', 'ary'] as Locale[]).map((language) => (
        <button key={language} type="button" aria-pressed={locale === language} onClick={() => setLocale(language)} className={`min-w-8 rounded-full px-2 py-1 text-[10px] font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${locale === language ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
          {language === 'ary' ? 'MR' : language.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
    href: string
  ) => {
    setMobileMenuOpen(false);
    if (id === 'try-on') {
      e.preventDefault();
      onOpenFitStudio();
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#06070B]/85 backdrop-blur-md border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => handleNavClick(e, 'home', '#home')}
          className="font-display text-xl sm:text-2xl font-extrabold tracking-[0.14em] text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded"
        >
          VYRO
        </a>

        {/* Zone 2: 5 Clean Single-Line Nav Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.id, link.href)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t(link.key)}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-rose-500 rounded-full"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Search + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Search Input */}
          <div className="hidden lg:flex items-center relative w-56 xl:w-64">
            <Search
              className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('nav.search')}
              aria-label={t('nav.searchLabel')}
              className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-white/[0.04] border border-white/10 rounded-full text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70 focus:bg-white/[0.07] transition-colors"
            />
          </div>

          {languageSwitch}

          <button type="button" onClick={onTrackOrder} className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-rose-500/40 hover:text-white">
            <PackageSearch className="h-4 w-4 text-rose-500" aria-hidden="true" />
            Track Order
          </button>

          <button type="button" onClick={onOpenAccount} aria-label="Account" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] p-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-rose-500/40 hover:text-white sm:px-3 sm:py-2">
            <UserRound className="h-4 w-4 text-rose-500" aria-hidden="true" />
            <span className="hidden xl:inline max-w-24 truncate">{accountName || 'Account'}</span>
          </button>

          {/* Wishlist Filter Toggle */}
          <button
            type="button"
            onClick={onToggleWishlistFilter}
            aria-label={`${t('nav.wishlist')} (${wishlistCount})`}
            title={showWishlistOnly ? t('catalog.showAll') : t('catalog.filterSaved')}
            className={`relative p-2.5 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              showWishlistOnly
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                showWishlistOnly ? 'fill-rose-500 text-rose-500' : ''
              }`}
              aria-hidden="true"
            />
            {wishlistCount > 0 && (
              <span className="font-mono-tabular absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-zinc-800 text-zinc-100 border border-white/15 rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`${t('nav.bag')} (${cartCount})`}
            className="relative p-2.5 rounded-full text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            <span className="font-mono-tabular absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-rose-600 text-white rounded-full">
              {cartCount}
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.07] bg-[#080A10] px-4 py-4 space-y-4">
          <div className="relative">
            <Search
              className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('nav.search')}
              aria-label={t('nav.searchLabel')}
              className="w-full h-10 pl-10 pr-4 text-sm bg-white/[0.05] border border-white/10 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <div className="flex justify-end">{languageSwitch}</div>
          <button type="button" onClick={() => { setMobileMenuOpen(false); onTrackOrder(); }} className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-zinc-200">
            <PackageSearch className="h-4 w-4 text-rose-500" aria-hidden="true" />
            Track Order
          </button>
          <button type="button" onClick={() => { setMobileMenuOpen(false); onOpenAccount(); }} className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-zinc-200">
            <UserRound className="h-4 w-4 text-rose-500" aria-hidden="true" />
            {accountName || 'Create account / Sign in'}
          </button>
          <nav className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.id, link.href)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === link.id
                    ? 'bg-rose-600/15 text-rose-400 font-semibold'
                    : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {t(link.key)}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
