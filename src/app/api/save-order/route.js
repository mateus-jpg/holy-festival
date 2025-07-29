// src/app/api/save-order/route.js
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import rateLimit from '@/app/lib/rate-limit';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const db = admin.firestore();

// Rate limiter: 20 requests per minute per IP
const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500, // Max 500 unique IPs per window
});

export async function POST(request) {
    try {
        // Rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'anonymous';

        try {
            await limiter.check(request, 20, ip);
        } catch {
            console.error('Rate limit exceeded for save-order');
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        const body = await request.json();
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

        // Input validation
        if (!paymentIntentId || !userId || !items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        if (items.length === 0) {
            return NextResponse.json(
                { error: 'Order must contain at least one item' },
                { status: 400 }
            );
        }

        // Validate items
        for (const item of items) {
            if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
                return NextResponse.json(
                    { error: 'Invalid item data' },
                    { status: 400 }
                );
            }
        }

        // Create order document
        const orderData = {
            // Order identification
            orderId: paymentIntentId,
            stripePaymentIntentId: paymentIntentId,
            userId: userId,

            // Process status
            processStatus: processStatus || 'processing',
            paymentStatus: paymentStatus || 'requires_payment_method',

            // Payment details
            amount: amount,
            currency: currency?.toUpperCase() || 'EUR',
            subtotal: subtotal || 0,
            tax: tax || 0,
            fees: fees || 0,

            // Order items
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                withFees: item.withFees || false
            })),
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),

            // Timestamps
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),

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
                updatedAt: admin.firestore.Timestamp.now(),
                source: 'checkout_page_update'
            });

            console.log(`Updated existing order ${paymentIntentId} for user ${userId}`);

            return NextResponse.json({
                success: true,
                orderId: paymentIntentId,
                message: 'Order updated successfully'
            });
        } else {
            // Create new order
            await orderRef.set(orderData);

            console.log(`Created new order ${paymentIntentId} for user ${userId}`);

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