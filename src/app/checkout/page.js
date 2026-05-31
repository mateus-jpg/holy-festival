// src/app/checkout/page.js
'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/app/lib/stripe';
import CheckoutForm from '@/app/components/CheckoutForm';
import { AppConfig } from '@/app/lib/config';
import { useAuth } from '@/app/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

// Create payment intent and save initial order
async function createPaymentIntentAndOrder(cart, user) {
  const getSubtotalAll = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getSubtotalWithFees = () => {
    return cart
      .filter((item) => item.withFees || item.withFee)
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = (subtotal) => {
    return subtotal * AppConfig.TAX_RATE;
  };

  const getFees = (feeBase) => {
    return feeBase > 0
      ? feeBase * AppConfig.TRANSACTION_RATE + AppConfig.TRANSACTION_FEE
      : 0;
  };

  const subtotalAll = getSubtotalAll();
  const subtotalWithFees = getSubtotalWithFees();

  const tax = getTax(subtotalAll);

  // Proportional tax share for items with fees
  const taxOnWithFees =
    subtotalAll > 0 ? (subtotalWithFees / subtotalAll) * tax : 0;

  const feeBase = subtotalWithFees + taxOnWithFees;
  const fees = getFees(feeBase);

  // Final total (in cents)
  const total = Math.round((subtotalAll + tax + fees) * 100);

  try {
    // Step 1: Create payment intent
    const paymentResponse = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        amount: total,
        items: cart,
        currency: AppConfig.CURRENCY,
      }),
    });

    if (!paymentResponse.ok) {
      const { error } = await paymentResponse.json();
      throw new Error(
        error || 'Creazione del payment intent non riuscita'
      );
    }

    const paymentData = await paymentResponse.json();

    // Step 2: Save initial order with processing status
    try {
      const orderResponse = await fetch('/api/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentData.payload.id,
          userId: user.uid,
          items: cart,
          amount: total,
          currency: AppConfig.CURRENCY,
          processStatus: 'processing',
          paymentStatus: 'requires_payment_method',
          subtotal: Math.round(subtotalAll * 100),
          tax: Math.round(tax * 100),
          fees: Math.round(fees * 100),
          clientSecret: paymentData.client_secret,
        }),
      });

      if (!orderResponse.ok) {
        console.error(
          'Failed to save initial order, but payment intent created'
        );
        // Don't throw error here - payment intent is created, webhook will handle order
      } else {
        console.log('Initial order saved successfully');
      }
    } catch (orderError) {
      console.error('Error saving initial order:', orderError);
      // Don't throw - webhook will create the order if this fails
    }

    return paymentData;
  } catch (error) {
    console.error('Error in payment flow:', error);
    throw error;
  }
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        // Check if user is authenticated
        if (!user) {
          setError('Accedi per continuare con il checkout.');
          setLoading(false);
          return;
        }

        // Get cart from localStorage
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (savedCart.length === 0) {
          setError('Il tuo carrello è vuoto.');
          setLoading(false);
          return;
        }

        // Validate cart items
        const validatedCart = savedCart.filter(
          (item) =>
            item.id &&
            item.name &&
            typeof item.price === 'number' &&
            item.price > 0 &&
            typeof item.quantity === 'number' &&
            item.quantity > 0
        );

        if (validatedCart.length === 0) {
          setError('Il tuo carrello contiene articoli non validi.');
          setLoading(false);
          return;
        }

        if (validatedCart.length !== savedCart.length) {
          console.warn('Some invalid items were removed from cart');
          localStorage.setItem('cart', JSON.stringify(validatedCart));
        }

        setCart(validatedCart);

        // Create payment intent and save initial order
        const data = await createPaymentIntentAndOrder(validatedCart, user);
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.payload.id);
      } catch (err) {
        console.error('Checkout initialization error:', err);
        setError(
          err.message || 'Inizializzazione del checkout non riuscita'
        );
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [user]);

  // Handle successful payment (called from CheckoutForm)
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      console.log('Payment succeeded:', paymentIntent.id);
      // Note: Cart will be cleared by the completion page
      // The CheckoutForm should handle the redirect to completion page
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  };

  // Handle payment error (called from CheckoutForm)
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error.message || 'Pagamento non riuscito. Riprova.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c5471f] mb-4"></div>
          <p className="text-[#012136]/65">
            Preparazione del checkout sicuro in corso...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-md">
          <AlertTriangle className="mx-auto mb-4 h-14 w-14 text-[#8f2f18]" />
          <h2 className="text-2xl font-bold text-[#8f2f18] mb-4">
            Errore nel Checkout
          </h2>
          <p className="text-[#012136]/65 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/cart"
              className="block bg-[#012136] hover:bg-[#0a6f6a] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Torna al Carrello
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Autenticazione Richiesta</h2>
        <p className="text-[#012136]/65 mb-6">
          Accedi per continuare con il checkout.
        </p>
        <a
          href="/auth"
          className="bg-[#012136] hover:bg-[#0a6f6a] text-white px-6 py-3 rounded-lg transition-colors"
        >
          Accedi
        </a>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#C5471F',
        colorBackground: '#ffffff',
        colorText: '#012136',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="min-h-screen bg-background flex justify-center items-center p-4">
      <div className="w-full max-w-md rounded-lg border border-[#012136]/12 bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2 text-[#012136]">Checkout sicuro</h1>
          <p className="text-[#012136]/65 text-sm">
            Completa il tuo pagamento in sicurezza con Stripe
          </p>
        </div>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-[#f6f2e8] rounded-lg text-[#012136]">
          <h3 className="font-semibold mb-2">Riepilogo ordine</h3>
          <div className="space-y-1 text-sm">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>€{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              paymentIntentId={paymentIntentId}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
