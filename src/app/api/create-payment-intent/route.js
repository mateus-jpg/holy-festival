// src/app/api/create-payment-intent/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import rateLimit from '@/app/lib/rate-limit';
import { getProduct } from '@/app/lib/products';
import { AppConfig } from '@/app/lib/config';
import { calculateCartTotals } from '@/app/lib/cartTotals';
import { verifyFirebaseIdToken } from '@/app/lib/server-auth';
import { admin, getAdminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

// Rate limiter: 10 requests per minute per IP
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 unique IPs per window
});

function getRequestIp(request) {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'anonymous'
    );
}

function getAvailableStock(product) {
    const availableStock = Number(product.availableStock);
    if (product.availableStock !== null && product.availableStock !== undefined && product.availableStock !== '' && Number.isFinite(availableStock)) {
        return availableStock;
    }

    const totalStock = Number(product.totalStock);
    const soldCount = Number(product.soldCount || 0);
    if (product.totalStock !== null && product.totalStock !== undefined && product.totalStock !== '' && Number.isFinite(totalStock)) {
        return Math.max(totalStock - soldCount, 0);
    }

    return null;
}

function jsonError(error, status) {
    return NextResponse.json({ error }, { status });
}

function isUsableStripeSecretKey(value) {
    return typeof value === 'string' &&
        value.startsWith('sk_') &&
        !value.includes('REPLACE_WITH');
}

async function storeInitialOrder(paymentIntent, userId, items, totals, currency) {
    const db = getAdminDb();
    const now = admin.firestore.Timestamp.now();
    const orderRef = db.collection('orders').doc(paymentIntent.id);

    await orderRef.set(
        {
            orderId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            userId,
            processStatus: 'processing',
            paymentStatus: paymentIntent.status,
            fulfillmentStatus: 'pending',
            amount: paymentIntent.amount,
            currency: currency.toUpperCase(),
            subtotal: totals.subtotalCents,
            tax: totals.taxCents,
            fees: totals.feesCents,
            items,
            itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            clientSecret: paymentIntent.client_secret,
            source: 'create_payment_intent',
            createdAt: now,
            updatedAt: now,
        },
        { merge: true }
    );
}

export async function POST(request) {

    try {
        // Rate limiting
        const ip = getRequestIp(request);

        try {
            await limiter.check(request, 10, ip);
        } catch {
            console.error('Rate limit exceeded');
            return jsonError('Rate limit exceeded', 429);
        }

        // Validate environment variables
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!isUsableStripeSecretKey(stripeKey)) {
            console.error('STRIPE_SECRET_KEY is missing or still set to a placeholder');
            return jsonError('Payment system configuration error', 500);
        }

        const decodedToken = await verifyFirebaseIdToken(request);
        if (!decodedToken) {
            return jsonError('Authentication required', 401);
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
        });

        let body;
        try {
            body = await request.json();
        } catch {
            return jsonError('Invalid JSON body', 400);
        }

        const { amount, currency = AppConfig.CURRENCY, items = [], userId: bodyUserId } = body;
        const userId = decodedToken.uid;

        if (bodyUserId && bodyUserId !== userId) {
            return jsonError('Authenticated user does not match order user', 403);
        }

        // Input validation
        const requestedAmount = Number(amount);
        const minimumAmountCents = Math.round(AppConfig.MIN_AMOUNT * 100);
        if (!Number.isInteger(requestedAmount) || requestedAmount < minimumAmountCents) {
            console.error('Invalid amount. Minimum configured amount required.');
            return jsonError(`Invalid amount. Minimum ${AppConfig.MIN_AMOUNT.toFixed(2)} ${AppConfig.CURRENCY.toUpperCase()} required.`, 400);
        }

        if (requestedAmount > 100000000) {
            console.error('Amount exceeds maximum limit');
            return jsonError('Amount exceeds maximum limit', 400);
        }

        const requestedCurrency = String(currency || '').toLowerCase();
        if (requestedCurrency !== AppConfig.CURRENCY) {
            return jsonError('Unsupported currency', 400);
        }

        if (!Array.isArray(items) || items.length === 0) {
            console.error('Invalid or empty cart');
            return jsonError('Invalid or empty cart', 400);
        }

        if (items.length > 50) {
            return jsonError('Cart contains too many items', 400);
        }

        const validatedItems = [];

        for (const item of items) {
            const quantity = Number(item.quantity);

            if (
                !item.id ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 100
            ) {
                console.error('Invalid cart item');
                return jsonError('Invalid cart item', 400);
            }

            let product;
            try {
                product = await getProduct(String(item.id));
            } catch (error) {
                if (error.status === 404) {
                    return jsonError('Product not found', 400);
                }

                throw error;
            }
            const productPrice = Number(product.price);

            if (product.isActive === false) {
                return jsonError(`Product ${product.id} is not available`, 400);
            }

            if (!Number.isFinite(productPrice) || productPrice <= 0) {
                return jsonError(`Product ${product.id} has an invalid price`, 400);
            }

            const requestedPrice = Number(item.price);
            if (!Number.isFinite(requestedPrice) || Math.round(requestedPrice * 100) !== Math.round(productPrice * 100)) {
                console.error('Price mismatch detected');
                return jsonError('Price mismatch detected', 400);
            }

            const availableStock = getAvailableStock(product);
            if (availableStock !== null && quantity > availableStock) {
                return jsonError(`Not enough stock for ${product.name || product.id}`, 400);
            }

            validatedItems.push({
                itemId: product.id,
                name: product.name || item.name || product.id,
                category: product.category || '',
                price: productPrice,
                quantity,
                withFees: Boolean(product.withFees || product.withFee),
            });
        }

        const totals = calculateCartTotals(validatedItems);

        // Verify calculated total matches requested amount
        if (Math.abs(totals.totalCents - requestedAmount) > 1) {
            console.error('Amount verification failed', {
                requestedAmount,
                calculatedAmount: totals.totalCents,
            });
            return jsonError('Amount verification failed', 400);
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totals.totalCents,
            currency: requestedCurrency,
            metadata: {
                userId,
                orderId: 'created_after_intent',
                itemCount: String(validatedItems.reduce((sum, item) => sum + item.quantity, 0)),
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        const updatedPaymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
            metadata: {
                userId,
                orderId: paymentIntent.id,
                itemCount: String(validatedItems.reduce((sum, item) => sum + item.quantity, 0)),
            },
        });

        await storeInitialOrder(updatedPaymentIntent, userId, validatedItems, totals, requestedCurrency);

        return NextResponse.json({
            client_secret: updatedPaymentIntent.client_secret,
            payload: updatedPaymentIntent,
            amount: totals.totalCents,
        });

    } catch (error) {
        console.error('Payment intent creation failed:', error);

        if (error.type === 'StripeCardError') {
            console.error("Strip Card Error")
            return jsonError(error.message, 400);
        }

        if (error.type === 'StripeInvalidRequestError') {
            return jsonError(error.message || 'Payment request rejected by Stripe', 400);
        }

        if (error.type === 'StripeAuthenticationError') {
            return jsonError('Payment provider configuration error', 500);
        }

        return jsonError('Payment processing error', 500);
    }
}
