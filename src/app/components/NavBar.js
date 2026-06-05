"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ClipboardList, LogIn, LogOut, Menu, QrCode, ShoppingCart, Ticket, TicketPlus, User, X } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { eventContent } from '@/app/lib/eventContent';

const publicLinks = [
  { href: '/info', label: 'Programma' },
  { href: '/faq', label: 'FAQ' },
  { href: '/tc', label: 'T&C' },
];

const privateLinks = [
  { href: '/profile', label: 'Profilo', icon: User },
  { href: '/shop', label: 'Biglietti', icon: Ticket },
  { href: '/tickets', label: 'Le tue prenotazioni', icon: Ticket },
];

const adminLinks = [
  { href: '/admin/manage-tickets', label: 'Gestisci', icon: ClipboardList },
  { href: '/admin/generate-tickets', label: 'Genera', icon: TicketPlus },
  { href: '/admin/validate', label: 'Valida QR', icon: QrCode },
];

const Logo = () => (
  <Link href="/" className="flex items-center gap-3" aria-label="Vai alla homepage">
    <Image
      src={eventContent.compactLogo}
      alt=""
      width={144}
      height={72}
      className="h-11 w-auto object-contain"
      priority
    />
    <span className="hidden border-l border-[#012136]/20 pl-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#c5471f] sm:inline">
      {eventContent.shortName}
    </span>
  </Link>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) => pathname === href;

  const linkClass = (href) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
      isActive(href)
        ? 'bg-[#012136] text-white'
        : 'text-[#012136]/78 hover:bg-[#012136]/8 hover:text-[#012136]'
    }`;

  const handleLogin = () => {
    setIsOpen(false);
    router.push('/auth');
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 left-0 z-50 w-full border-b border-[#012136]/12 bg-[#fffaf0]/88 shadow-sm backdrop-blur-xl" aria-label="Navigazione principale">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)} aria-current={isActive(link.href) ? 'page' : undefined}>
                {link.label}
              </Link>
            ))}
            {user && privateLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)} aria-current={isActive(link.href) ? 'page' : undefined}>
                {link.label}
              </Link>
            ))}
            {user?.isAdmin && adminLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)} aria-current={isActive(link.href) ? 'page' : undefined}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-full bg-[#c5471f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#8f2f18]"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Carrello
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-full border border-[#012136]/20 px-4 py-2 text-sm font-semibold text-[#012136] transition-colors hover:bg-[#012136]/8"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Esci
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex items-center gap-2 rounded-full bg-[#012136] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a6f6a]"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Accedi
              </button>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#012136]/18 bg-white text-[#012136] shadow-sm transition-colors hover:bg-[#012136]/8 md:hidden"
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
          >
            <span className="sr-only">{isOpen ? 'Chiudi menu' : 'Apri menu'}</span>
            {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[#012136]/10 bg-[#fffaf0] md:hidden" id="mobile-menu">
          <div className="space-y-1 px-4 py-4">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${linkClass(link.href)} block`}
                onClick={() => setIsOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            {user && privateLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkClass(link.href)} flex items-center gap-2`}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            {user?.isAdmin && adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkClass(link.href)} flex items-center gap-2`}
                  onClick={() => setIsOpen(false)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="flex items-center gap-2 rounded-full bg-[#c5471f] px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Carrello
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-full border border-[#012136]/20 px-4 py-3 text-left text-sm font-semibold text-[#012136]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Esci
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="flex w-full items-center gap-2 rounded-full bg-[#012136] px-4 py-3 text-left text-sm font-semibold text-white"
              >
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
