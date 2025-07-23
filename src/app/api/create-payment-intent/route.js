// src/app/api/create-payment-intent/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import rateLimit from '@/app/lib/rate-limit';
import { getProductPrice } from '@/app/lib/products';
import { AppConfig } from '@/app/lib/config';



// Rate limiter: 10 requests per minute per IP
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 unique IPs per window
});

export async function POST(request) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'anonymous';

        try {
            await limiter.check(request, 10, ip);
        } catch {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        // Validate environment variables
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY is not configured');
            return NextResponse.json(
                { error: 'Payment system configuration error' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { amount, currency = AppConfig.CURRENCY, items = [] } = body;

        // Input validation
        if (!amount || typeof amount !== 'number' || amount < AppConfig.MIN_AMOUNT) {
            return NextResponse.json(
                { error: 'Invalid amount. Minimum $0.50 required.' },
                { status: 400 }
            );
        }

        if (amount > 100000000) { // $1M limit
            return NextResponse.json(
                { error: 'Amount exceeds maximum limit' },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Invalid or empty cart' },
                { status: 400 }
            );
        }

        // Validate cart items and recalculate total server-side
        let calculatedTotal = 0;
        let calculatedTotalWithFees = 0;
        const validatedItems = [];

        for (const item of items) {
            // In production, fetch actual prices from Firestore
            // This prevents price manipulation on client-side
            if (!item.id || !item.price || !item.quantity || item.quantity < 1) {
                return NextResponse.json(
                    { error: 'Invalid cart item' },
                    { status: 400 }
                );
            }


            // TODO: block IP
            const actualPrice = await getProductPrice(item.id);
            if (actualPrice !== item.price) {
                return NextResponse.json(
                    { error: 'Price mismatch detected' },
                    { status: 400 }
                );
            }

            if (item.withFees) {
                calculatedTotalWithFees += item.price * item.quantity;
            }
            else {

                calculatedTotal += item.price * item.quantity;
            }
            validatedItems.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            });
        }

        // Add tax (8%)
        const tax = calculatedTotal * AppConfig.TAX_RATE;
        const fees = calculatedTotalWithFees > 0 ? (calculatedTotalWithFees * AppConfig.TRANSACTION_RATE) + AppConfig.TRANSACTION_FEE : 0;

        const finalTotal = Math.round((calculatedTotal + tax + fees) * 100);

        // Verify calculated total matches requested amount
        if (Math.abs(finalTotal - amount) > 1) { // Allow 1 cent difference for rounding
            return NextResponse.json(
                { error: 'Amount verification failed' },
                { status: 400 }
            );
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: finalTotal,
            currency: currency.toLowerCase(),
            metadata: {
                orderItems: JSON.stringify(validatedItems),
                itemCount: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            client_secret: paymentIntent.client_secret,
            amount: finalTotal,
        });

    } catch (error) {
        console.error('Payment intent creation failed:', error);

        if (error.type === 'StripeCardError') {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Payment processing error' },
            { status: 500 }
        );
    }
}

