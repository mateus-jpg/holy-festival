"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Code } from 'lucide-react';

// You can create a simple Logo component or just use text/image
const Logo = () => (
  <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors">
    <Code className="h-8 w-8 text-indigo-600 dark:text-indigo-500" />
    <span>Holy Festival</span>
  </Link>
);

export default function Navbar() {
  // State to manage the mobile menu's visibility
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname()

  // Navigation links data
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/profile', label: 'Profilo' },
    { href: '/shop', label: 'Shop' },
    { href: '/tickets', label: 'I tuoi Tickets' },
  ];

  return (
    // The main nav element with glassmorphism styling
    // - `fixed`: Keeps the navbar at the top
    // - `w-full`: Makes it span the full width
    // - `z-50`: Ensures it stays on top of other content
    // - `bg-white/30`: Semi-transparent white background. The alpha channel (e.g., /30) is crucial for the effect.
    // - `backdrop-blur-lg`: This is the magic property that blurs the content behind the element.
    // - `shadow-lg`: Adds a subtle shadow for depth.
    // - `border-b border-white/20`: A light bottom border to define the edge.
    <nav className="sticky top-0 left-0 w-full z-50 bg-white/30 dark:bg-black/30 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  // Added dark mode classes for link styling
                  className="text-gray-700 hover:bg-white/50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
              
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              // Added dark mode classes for the button
              className="bg-white/20 dark:bg-white/10 inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-white"
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
             {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  // Added dark mode classes for mobile links
                  className="text-gray-700 hover:bg-white/50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-300"
                  onClick={() => setIsOpen(false)} // Close menu on click
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}
