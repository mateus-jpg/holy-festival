// src/app/components/CheckoutForm.js
'use client';

import { useState } from 'react';
import {
    useStripe,
    useElements,
    PaymentElement,
} from '@stripe/react-stripe-js';

export default function CheckoutForm({
    onPaymentSuccess,
    onPaymentError,
    paymentIntentId
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    // This is where users will be redirected after payment
                    return_url: `${window.location.origin}/completion`,
                },
                redirect: 'if_required',
            });

            if (error) {
                // Payment failed
                console.error('Payment error:', error);
                setMessage(error.message || 'An unexpected error occurred.');
                onPaymentError?.(error);
            } else if (paymentIntent) {
                // Payment succeeded
                console.log('Payment succeeded:', paymentIntent);
                onPaymentSuccess?.(paymentIntent);

                // If no redirect happened (payment succeeded without additional auth),
                // manually redirect to completion page
                if (paymentIntent.status === 'succeeded') {
                    window.location.href = `/completion?payment_intent_client_secret=${paymentIntent.client_secret}&redirect_status=succeeded`;
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setMessage('An unexpected error occurred.');
            onPaymentError?.(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {message && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className={`
          w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
          ${isLoading || !stripe || !elements
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    }
        `}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                    </div>
                ) : (
                    'Pay Now'
                )}
            </button>

            <div className="text-xs text-gray-500 text-center">
                Your payment is secured by Stripe
            </div>
        </form>
    );
}