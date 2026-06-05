// src/app/components/CheckoutForm.js
'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
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
    const termsCheckboxId = useId();
    const termsDescriptionId = `${termsCheckboxId}-description`;
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!acceptedTerms) {
            setMessage('Devi accettare i Termini e Condizioni per procedere con il pagamento.');
            return;
        }

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
                setMessage(error.message || 'Si è verificato un errore imprevisto.');
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
            setMessage('Si è verificato un errore imprevisto.');
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

            <div className="rounded-lg border border-[#012136]/12 bg-[#f6f2e8] p-4">
                <div className="flex items-start gap-3 text-sm leading-relaxed text-[#012136]/78">
                    <input
                        id={termsCheckboxId}
                        type="checkbox"
                        required
                        aria-describedby={termsDescriptionId}
                        checked={acceptedTerms}
                        onChange={(event) => {
                            setAcceptedTerms(event.target.checked);
                            if (event.target.checked && message.startsWith('Devi accettare')) {
                                setMessage('');
                            }
                        }}
                        onInvalid={() => {
                            setMessage('Devi accettare i Termini e Condizioni per procedere con il pagamento.');
                        }}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#c5471f]"
                    />
                    <div>
                        <label htmlFor={termsCheckboxId}>
                            Accetto i Termini e Condizioni di vendita dei biglietti.
                        </label>
                        <div id={termsDescriptionId}>
                            <Link
                                href="/tc"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-[#c5471f] underline-offset-2 hover:underline"
                            >
                                Leggi i Termini e Condizioni
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

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
                        : 'bg-[#c5471f] hover:bg-[#8f2f18] text-white shadow-sm hover:shadow-md'
                    }
        `}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Elaborazione...
                    </div>
                ) : (
                    'Paga ora'
                )}
            </button>

            <div className="text-xs text-gray-500 text-center">
                Il pagamento è protetto da Stripe
            </div>
        </form>
    );
}
