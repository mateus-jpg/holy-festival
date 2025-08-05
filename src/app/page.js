// src/app/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication status is determined
    if (!loading) {
      if (!user) {
        // If no user, redirect to the authentication page
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  // While checking for the user, show a loading screen.
  // This prevents the page from flashing before the redirect.
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
      </div>
    );
  }

  // If the user is logged in, show the main content.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Holy Festival 2025</h1>
      <p className="text-lg text-gray-400 mb-8">
        You are successfully logged in as {user.email}.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/profile"
          className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
        >
          Go to Your Profile
        </Link>
        <Link 
          href="/shop"
          className="bg-foreground text-background px-6 py-3 rounded-full hover:bg-[#ccc] transition-colors"
        >
          Browse the Shop
        </Link>
      </div>
    </div>
  );
}