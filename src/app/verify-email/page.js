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
      setMessage('Una nuova email di verifica è stata inviata.');
    } catch (err) {
      setError('Impossibile inviare l’email. Attendi qualche minuto e riprova.');
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white shadow-sm rounded-lg border border-[#012136]/12 p-8">
        <MailCheck className="w-16 h-16 mx-auto text-[#c5471f] mb-4" />
        <h1 className="text-2xl font-bold text-[#012136] mb-2">Verifica la tua email</h1>
        <p className="text-[#012136]/68 mb-6">
          Abbiamo inviato un link di verifica a <strong>{user.email}</strong>. Controlla la posta in arrivo e la cartella spam per continuare.
        </p>

        {message && <p className="mb-4 rounded-md border border-green-500/30 bg-green-500/12 p-3 text-green-700">{message}</p>}
        {error && <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/12 p-3 text-red-700">{error}</p>}
        
        <p className="text-sm text-[#012136]/55 mb-6">
          Questa pagina ti reindirizzerà automaticamente dopo la verifica.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleResendEmail}
            disabled={resendLoading}
            className="bg-[#012136] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0a6f6a] transition-colors disabled:opacity-50"
          >
            {resendLoading ? 'Invio...' : 'Invia di nuovo'}
          </button>
          <button
            onClick={signOut}
            className="text-[#012136]/65 hover:text-[#012136] transition-colors"
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}
