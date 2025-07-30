// src/app/api/create-payment-intent/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import rateLimit from '@/app/lib/rate-limit';
import { getProductPrice } from '@/app/lib/products';
import { AppConfig } from '@/app/lib/config';
import Products from '@/app/shop/page';


const stripeKey = process.env.STRIPE_SECRET_KEY
// Rate limiter: 10 requests per minute per IP
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 unique IPs per window
});

export async function POST(request) {

    try {
        console.log('STRIPE_SECRET_KEY exists:', !!stripeKey);
        console.log('STRIPE_SECRET_KEY length:', stripeKey.length);
        const stripe = new Stripe(stripeKey);/* , {
            apiVersion: '2023-10-16',
        } );*/
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'anonymous';

        try {
            await limiter.check(request, 10, ip);
        } catch {
            console.error('Rate limit exceeded');
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
        const { amount, currency = AppConfig.CURRENCY, items = [], userId } = body;

        // Input validation
        if (!amount || typeof amount !== 'number' || amount < AppConfig.MIN_AMOUNT) {
            console.error('Invalid amount. Minimum $0.50 required.')
            return NextResponse.json(
                { error: 'Invalid amount. Minimum $0.50 required.' },
                { status: 400 }
            );
        }

        if (amount > 100000000) { // $1M limit
            console.error('Amount exceeds maximumm limit')
            return NextResponse.json(
                { error: 'Amount exceeds maximum limit' },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            console.error('invalid or empty cart')
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
                console.error('invalid cart item')
                return NextResponse.json(
                    { error: 'Invalid cart item' },
                    { status: 400 }
                );
            }


            // TODO: block IP
            const actualPrice = await getProductPrice(item.id);
            if (actualPrice !== item.price) {
                console.error("Price mismatch detected")
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
                itemId: item.id,
                category: item.category,
                price: item.price,
                quantity: item.quantity
            });
        }

        // Add tax (8%)
        // Total before tax
        const totalBeforeTax = calculatedTotal + calculatedTotalWithFees;

        // Apply tax to the full total
        const tax = totalBeforeTax * AppConfig.TAX_RATE;

        const withFeesTaxed = calculatedTotalWithFees + (calculatedTotalWithFees * AppConfig.TAX_RATE);


        // Fees are applied only to the "withFees" items + their tax share
        const fees = calculatedTotalWithFees > 0
            ? (withFeesTaxed * AppConfig.TRANSACTION_RATE) + AppConfig.TRANSACTION_FEE
            : 0;

        // Final amount (in cents)
        const finalTotal = Math.round((totalBeforeTax + tax + fees) * 100);

        // Verify calculated total matches requested amount
        if (Math.abs(finalTotal - amount) > 1) { // Allow 1 cent difference for rounding
            console.error("amount verification failde")
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
                userId: userId,
                orderItems: JSON.stringify(validatedItems),
                itemCount: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            client_secret: paymentIntent.client_secret,
            payload: paymentIntent,
            amount: finalTotal,
        });

    } catch (error) {
        console.error('Payment intent creation failed:', error);

        if (error.type === 'StripeCardError') {
            console.error("Strip Card Error")
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

