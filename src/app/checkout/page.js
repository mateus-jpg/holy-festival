// src/app/checkout/page.js
'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/app/lib/stripe';
import CheckoutForm from '@/app/components/CheckoutForm';
import { AppConfig } from '@/app/lib/config';
import { useAuth } from '@/app/contexts/AuthContext';

// Create payment intent and save initial order
async function createPaymentIntentAndOrder(cart, user) {
  const getSubtotalAll = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getSubtotalWithFees = () => {
    return cart
      .filter((item) => "withFees" in item && item.withFees)
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = (subtotal) => {
    return subtotal * AppConfig.TAX_RATE;
  };

  const getFees = (feeBase) => {
    return feeBase > 0
      ? (feeBase * AppConfig.TRANSACTION_RATE) + AppConfig.TRANSACTION_FEE
      : 0;
  };

  const subtotalAll = getSubtotalAll();
  const subtotalWithFees = getSubtotalWithFees();

  const tax = getTax(subtotalAll);

  // Proportional tax share for items with fees
  const taxOnWithFees = subtotalAll > 0
    ? (subtotalWithFees / subtotalAll) * tax
    : 0;

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
      throw new Error(error || 'Failed to create payment intent');
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
          clientSecret: paymentData.client_secret
        }),
      });

      if (!orderResponse.ok) {
        console.error('Failed to save initial order, but payment intent created');
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
          setError('Please log in to continue with checkout.');
          setLoading(false);
          return;
        }

        // Get cart from localStorage
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (savedCart.length === 0) {
          setError('Your cart is empty.');
          setLoading(false);
          return;
        }

        // Validate cart items
        const validatedCart = savedCart.filter(item =>
          item.id &&
          item.name &&
          typeof item.price === 'number' &&
          item.price > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
        );

        if (validatedCart.length === 0) {
          setError('Your cart contains invalid items.');
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
        setError(err.message || 'Failed to initialize checkout');
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
    setError(error.message || 'Payment failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-400">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-500 mb-4">Checkout Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/cart"
              className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Return to Cart
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-400 mb-6">Please log in to continue with checkout.</p>
        <a
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Log In
        </a>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Secure Checkout</h1>
          <p className="text-gray-400 text-sm">
            Complete your payment safely with Stripe
          </p>
        </div>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="space-y-1 text-sm">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
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