'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { auth } from '@/app/lib/firebase';
import { MailCheck, Hourglass } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, signOut, resendVerificationEmail, loading: authLoading } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // If user is verified, redirect them to their profile
    if (user?.emailVerified) {
      router.push('/profile');
    }

    // Handle the case where a user lands here without being logged in
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const handleResendEmail = async () => {
    setResendLoading(true);
    setError('');
    setMessage('');
    try {
      await resendVerificationEmail();
      setMessage('A new verification email has been sent.');
    } catch (err) {
      setError('Failed to resend email. Please wait a few minutes and try again.');
    }
    setResendLoading(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Hourglass className="animate-spin h-12 w-12" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
        <MailCheck className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">
          A verification link has been sent to <strong>{user.email}</strong>. Please check your inbox (and spam folder) to continue.
        </p>

        {message && <p className="p-3 bg-green-100 text-green-700 rounded-md mb-4">{message}</p>}
        {error && <p className="p-3 bg-red-100 text-red-700 rounded-md mb-4">{error}</p>}
        
        <p className="text-sm text-gray-500 mb-6">
          This page will automatically redirect after you verify your email.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleResendEmail}
            disabled={resendLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend Email'}
          </button>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-black transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}