// src/app/checkout/page.js
'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/app/lib/stripe';
import CheckoutForm from '@/app/components/CheckoutForm';
import { AppConfig } from '@/app/lib/config'; // Assuming you have a config file

// A separate function to handle the API call
async function createPaymentIntent(cart) {
  const getSubtotalAll = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getSubtotalWithFees = () => {
    return cart
      .filter((item) => "withFees" in item && item.withFee)
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

  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: total,
      items: cart,
      currency: AppConfig.CURRENCY,
    }),
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error || 'Failed to create payment intent');
  }

  return response.json();
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const initializeCheckout = async () => {
      try {
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (savedCart.length === 0) {
          setError('Your cart is empty.');
          setLoading(false);
          return;
        }
        setCart(savedCart);

        const data = await createPaymentIntent(savedCart);
        setClientSecret(data.client_secret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initializeCheckout();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-foreground"></div>
        <p className="ml-4">Preparing secure checkout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">An Error Occurred</h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <a href="/cart" className="mt-6 bg-foreground text-background px-6 py-2 rounded-full">
          Return to Cart
        </a>
      </div>
    );
  }

  const options = { clientSecret };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Confirm Your Payment</h1>
        {clientSecret && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        )}
      </div>
    </div>
  );
}