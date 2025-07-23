import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CompletionPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    if (!paymentIntentClientSecret) {
      setStatus('error');
      setError('Required payment information is missing.');
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
      setError('Payment failed. Please try again or use a different payment method.');
    } else {
      setStatus('error');
      setError('An unknown error occurred.');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
        <p className="ml-4">Verifying payment...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Thank you for your order. A confirmation has been sent to your email.
        </p>
        <Link href="/shop" className="bg-foreground text-background px-6 py-2 rounded-full">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Payment Failed</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <Link href="/cart" className="bg-foreground text-background px-6 py-2 rounded-full">
          Return to Cart
        </Link>
      </div>
    );
  }

  return null;
}