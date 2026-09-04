"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LogIn, LogOut, Menu, QrCode, ShoppingCart, Ticket, TicketPlus, User, X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import holyFestivalLogo from '../../../public/images/holy-logo-type-transparent.png';

const publicLinks = [
  { href: '/info', label: 'Programma' },
  { href: '/faq', label: 'FAQ' },
  { href: '/tc', label: 'T&C' },
];

const memberLinks = [
  { href: '/profile', label: 'Profilo', icon: User },
  { href: '/shop', label: 'Prenotazioni', icon: Ticket },
  { href: '/tickets', label: 'Le tue prenotazioni', icon: Ticket },
];

const adminLinks = [
  { href: '/admin/manage-tickets', label: 'Gestisci', icon: ClipboardList },
  { href: '/admin/generate-tickets', label: 'Genera', icon: TicketPlus },
  { href: '/admin/validate', label: 'Valida QR', icon: QrCode },
];

function BrandLockup() {
  return (
    <Link href="/" className="brand-logo-link" aria-label="Holy Festival — vai alla homepage">
      <Image
        src={holyFestivalLogo}
        alt="Holy Festival Verona"
        width={592}
        height={588}
        className="brand-logo-image"
        priority
      />
    </Link>
  );
}

export default function BrandNavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);
  const closeMenu = () => setIsOpen(false);

  const handleLogin = () => {
    closeMenu();
    router.push('/auth');
  };

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
    router.push('/');
  };

  const renderLink = (link, mobile = false) => {
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`nav-link ${isActive(link.href) ? 'is-active' : ''} ${mobile ? 'flex items-center gap-2' : ''}`}
        onClick={closeMenu}
        aria-current={isActive(link.href) ? 'page' : undefined}
      >
        {mobile && Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="sticky left-0 top-0 z-50 w-full border-b border-[rgba(200,250,247,0.24)] bg-[#170020]/92 backdrop-blur-xl" aria-label="Navigazione principale">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.5rem] items-center justify-between gap-4">
          <BrandLockup />

          <div className="hidden items-center gap-1 lg:flex">
            {publicLinks.map((link) => renderLink(link))}
            {user && memberLinks.map((link) => renderLink(link))}
            {user?.isAdmin && adminLinks.map((link) => renderLink(link))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link href="/cart" className="nav-action nav-action-primary">
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Carrello
                </Link>
                <button type="button" onClick={handleSignOut} className="nav-action nav-action-secondary">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Esci
                </button>
              </>
            ) : (
              <button type="button" onClick={handleLogin} className="nav-action nav-action-primary">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Accedi
              </button>
            )}
          </div>

          <button
            onClick={() => setIsOpen((open) => !open)}
            type="button"
            className="nav-action nav-action-secondary mobile-menu-toggle h-11 w-11 p-0"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">{isOpen ? 'Chiudi menu' : 'Apri menu'}</span>
            {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mobile-menu-panel border-t border-[rgba(200,250,247,0.24)] bg-[#21082f]" id="mobile-menu">
          <div className="space-y-1 px-4 py-4">
            {publicLinks.map((link) => renderLink(link, true))}
            {user && memberLinks.map((link) => renderLink(link, true))}
            {user?.isAdmin && adminLinks.map((link) => renderLink(link, true))}
            {user ? (
              <>
                <Link href="/cart" className="nav-action nav-action-primary mt-3 flex w-full" onClick={closeMenu}>
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Carrello
                </Link>
                <button type="button" onClick={handleSignOut} className="nav-action nav-action-secondary mt-2 flex w-full">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Esci
                </button>
              </>
            ) : (
              <button type="button" onClick={handleLogin} className="nav-action nav-action-primary mt-3 flex w-full">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Accedi
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
