'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export function CompletionPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const paymentIntentClientSecret = searchParams.get(
      'payment_intent_client_secret'
    );

    if (!paymentIntentClientSecret) {
      setStatus('error');
      setError('Le informazioni di pagamento richieste sono mancanti.');
      return;
    }

    // You could optionally fetch the payment intent status from your server here
    // to get more details, but for now, we'll rely on the redirect status.
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded') {
      setStatus('success');
      // Clear the cart from local storage after a successful payment
      localStorage.removeItem('cart');
    } else if (redirectStatus === 'failed') {
      setStatus('error');
      setError(
        'Pagamento non riuscito. Riprova o utilizza un altro metodo di pagamento.'
      );
    } else {
      setStatus('error');
      setError('Si è verificato un errore sconosciuto.');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
        <p className="ml-4">Verifica del pagamento in corso...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Pagamento Riuscito!
        </h1>
        <p className="text-gray-300 mb-6">
          Grazie per il tuo ordine. Una conferma è stata inviata alla tua email.
        </p>
        <Link
          href="/shop"
          className="bg-foreground text-background px-6 py-2 rounded-full"
        >
          Continua lo Shopping
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">
          Pagamento non Riuscito
        </h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link
          href="/cart"
          className="bg-foreground text-background px-6 py-2 rounded-full"
        >
          Torna al Carrello
        </Link>
      </div>
    );
  }

  return null;
}

export default function CompletionWrapper() {
  return (
    <Suspense>
      <CompletionPageInner></CompletionPageInner>
    </Suspense>
  );
}