// src/app/api/save-order/route.js
import { NextResponse } from 'next/server';
import rateLimit from '@/app/lib/rate-limit';
import { admin, getAdminDb } from '@/app/lib/firebase-admin';
import { verifyFirebaseIdToken } from '@/app/lib/server-auth';

export const runtime = 'nodejs';

// Rate limiter: 20 requests per minute per IP
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

function jsonError(error, status) {
    return NextResponse.json({ error }, { status });
}

export async function POST(request) {
    try {
        // Rate limiting
        const ip = getRequestIp(request);

        try {
            await limiter.check(request, 20, ip);
        } catch {
            console.error('Rate limit exceeded for save-order');
            return jsonError('Rate limit exceeded', 429);
        }

        const decodedToken = await verifyFirebaseIdToken(request);
        if (!decodedToken) {
            return jsonError('Authentication required', 401);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return jsonError('Invalid JSON body', 400);
        }

        const {
            paymentIntentId,
            userId,
            items,
            amount,
            currency,
            processStatus,
            paymentStatus,
            subtotal,
            tax,
            fees,
            clientSecret
        } = body;

        if (userId && userId !== decodedToken.uid) {
            return jsonError('Authenticated user does not match order user', 403);
        }

        // Input validation
        if (!paymentIntentId || !Array.isArray(items)) {
            return jsonError('Missing required fields', 400);
        }

        const numericAmount = Number(amount);
        if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
            return jsonError('Invalid amount', 400);
        }

        if (items.length === 0) {
            return jsonError('Order must contain at least one item', 400);
        }

        // Validate items
        for (const item of items) {
            if (
                !item.id ||
                !item.name ||
                typeof item.price !== 'number' ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) < 1
            ) {
                return jsonError('Invalid item data', 400);
            }
        }

        const db = getAdminDb();
        const now = admin.firestore.Timestamp.now();

        // Create order document
        const orderData = {
            // Order identification
            orderId: paymentIntentId,
            stripePaymentIntentId: paymentIntentId,
            userId: decodedToken.uid,

            // Process status
            processStatus: processStatus || 'processing',
            paymentStatus: paymentStatus || 'requires_payment_method',

            // Payment details
            amount: numericAmount,
            currency: currency?.toUpperCase() || 'EUR',
            subtotal: subtotal || 0,
            tax: tax || 0,
            fees: fees || 0,

            // Order items
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: Number(item.quantity),
                withFees: item.withFees || false
            })),
            itemCount: items.reduce((sum, item) => sum + Number(item.quantity), 0),

            // Timestamps
            createdAt: now,
            updatedAt: now,

            // Additional data
            clientSecret: clientSecret,
            source: 'checkout_page',

            // Flags
            requiresAction: false,
            isInitialSave: true
        };

        // Check if order already exists
        const orderRef = db.collection('orders').doc(paymentIntentId);
        const existingOrder = await orderRef.get();

        if (existingOrder.exists) {
            // Update existing order, preserve createdAt
            await orderRef.update({
                processStatus: orderData.processStatus,
                paymentStatus: orderData.paymentStatus,
                updatedAt: now,
                source: 'checkout_page_update'
            });

            console.log(`Updated existing order ${paymentIntentId} for user ${decodedToken.uid}`);

            return NextResponse.json({
                success: true,
                orderId: paymentIntentId,
                message: 'Order updated successfully'
            });
        } else {
            // Create new order
            await orderRef.set(orderData);

            console.log(`Created new order ${paymentIntentId} for user ${decodedToken.uid}`);

            return NextResponse.json({
                success: true,
                orderId: paymentIntentId,
                message: 'Order created successfully'
            });
        }

    } catch (error) {
        console.error('Error saving order:', error);

        return NextResponse.json(
            { error: 'Failed to save order' },
            { status: 500 }
        );
    }
}
