// src/app/components/CheckoutForm.js
'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/completion`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, the customer will be redirected.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage("An unexpected error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="w-full bg-foreground text-background py-3 rounded-full font-semibold hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <span id="button-text">
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background"></div>
          ) : (
            "Pay now"
          )}
        </span>
      </button>

      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className="text-red-500 text-sm text-center">
          {message}
        </div>
      )}
    </form>
  );
}