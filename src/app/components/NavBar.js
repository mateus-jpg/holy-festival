"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Code, LogIn, ShoppingCart } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// You can create a simple Logo component or just use text/image
const Logo = () => (
  <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-gray-200 hover:text-white transition-colors">
    {/* <Code className="h-8 w-8 text-indigo-600 dark:text-indigo-500" /> */}
    <Image src="/logo.png" alt="Holy Festival Logo" width={64} height={64} />
    <h1 className='font-cuanky pt-2 pl-2'>Holy Festival</h1>
  </Link>
);

export default function Navbar() {
  // State to manage the mobile menu's visibility
  const [isOpen, setIsOpen] = useState(false);
  const { user, updateUserProfile, signOut } = useAuth();
  const pathname = usePathname()
  const router = useRouter();
  // Navigation links data
  const navLinks = [
    { href: '/profile', label: 'Profilo' },
    { href: '/shop', label: 'Shop' },
    { href: '/tickets', label: 'I tuoi Tickets' },
  ];


  const handleLogin = async () => {
    router.push('/auth')
  }
  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    // The main nav element with glassmorphism styling
    // - `fixed`: Keeps the navbar at the top
    // - `w-full`: Makes it span the full width
    // - `z-50`: Ensures it stays on top of other content
    // - `bg-white/30`: Semi-transparent white background. The alpha channel (e.g., /30) is crucial for the effect.
    // - `backdrop-blur-lg`: This is the magic property that blurs the content behind the element.
    // - `shadow-lg`: Adds a subtle shadow for depth.
    // - `border-b border-white/20`: A light bottom border to define the edge.
    <nav className="sticky top-0 left-0 w-full z-50 bg-black/30 backdrop-blur-lg shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Menu */}
          {user && <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  // Added dark mode classes for link styling
                  className=" text-gray-300 hover:bg-white/10 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}

            </div>
          </div>}

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {user ? (<Link
                href="/cart"
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                <ShoppingCart className="w-4 h-4" />
                Carrello
              </Link>) :
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  LogIn
                </button>}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              // Added dark mode classes for the button
              className=" bg-white/10 inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu (conditionally rendered) */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // Added dark mode classes for mobile links
                className=" text-gray-300 hover:bg-white/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                onClick={() => setIsOpen(false)} // Close menu on click
              >
                {link.label}
              </Link>
            ))}
            {user ? (<Link
              href="/cart"
              className="flex text-gray-300 hover:bg-white/10 hover:text-white  px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
            >
              Carrello
              <ShoppingCart className="" />
            </Link>) :
              <button
                onClick={handleLogin}
                className="flex text-gray-300 hover:bg-white/10 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
              >
                LogIn
                <LogIn className="" />
              </button>}
          </div>
        </div>
      )}
    </nav>
  );
}
