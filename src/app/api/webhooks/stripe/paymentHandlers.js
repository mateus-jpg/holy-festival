import { admin, getAdminDb } from '@/app/lib/firebase-admin';
import { createUserProducts, updateProductInventory } from '@/app/lib/ticket-fulfillment';

const FULFILLMENT_RETRY_AFTER_MS = 5 * 60 * 1000;

export async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        console.log('Processing successful payment:', paymentIntent.id);
        const db = getAdminDb();
        const now = admin.firestore.Timestamp.now();

        // Extract metadata
        const { userId, orderItems, itemCount } = paymentIntent.metadata;

        if (!userId || !orderItems) {
            console.error('Missing required metadata in payment intent');
            return;
        }

        // Parse order items
        let parsedItems;
        try {
            parsedItems = JSON.parse(orderItems);
        } catch (error) {
            console.error('Failed to parse order items:', error);
            return;
        }

        // Create order document with process status
        const orderData = {
            // Order identification
            orderId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            userId: userId,

            // Process status - can be: 'pending', 'processing', 'completed', 'failed', 'cancelled'
            processStatus: 'completed',
            paymentStatus: paymentIntent.status,

            // Payment details
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),

            // Order items
            items: parsedItems,
            itemCount: parseInt(itemCount),

            // Timestamps
            createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
            updatedAt: now,
            completedAt: now,

            // Payment method info
            paymentMethodId: paymentIntent.payment_method,
            paymentMethodTypes: paymentIntent.payment_method_types,

            // Additional Stripe data
            stripeData: {
                clientSecret: paymentIntent.client_secret,
                latestCharge: paymentIntent.latest_charge,
                receiptEmail: paymentIntent.receipt_email,
                livemode: paymentIntent.livemode
            }
        };

        const orderRef = db.collection('orders').doc(paymentIntent.id);
        let shouldFulfill = false;

        await db.runTransaction(async (transaction) => {
            const existingOrder = await transaction.get(orderRef);
            const existingData = existingOrder.exists ? existingOrder.data() : {};
            const fulfillmentStatus = existingData.fulfillmentStatus;
            const processingAt = existingData.fulfillmentProcessingAt?.toMillis?.() || 0;
            const processingIsStale =
                fulfillmentStatus === 'processing' &&
                Date.now() - processingAt > FULFILLMENT_RETRY_AFTER_MS;

            shouldFulfill =
                fulfillmentStatus !== 'fulfilled' &&
                (fulfillmentStatus !== 'processing' || processingIsStale);

            transaction.set(
                orderRef,
                {
                    ...orderData,
                    fulfillmentStatus: shouldFulfill ? 'processing' : fulfillmentStatus || 'fulfilled',
                    fulfillmentProcessingAt: shouldFulfill ? now : existingData.fulfillmentProcessingAt || now,
                },
                { merge: true }
            );
        });

        console.log(`Order ${paymentIntent.id} successfully stored with status 'completed' for user ${userId}`);

        if (!shouldFulfill) {
            console.log(`Order ${paymentIntent.id} was already fulfilled or is currently being fulfilled`);
            return;
        }

        try {
            await createUserProducts(paymentIntent.id, userId, parsedItems);
            await updateProductInventory(parsedItems);
            await orderRef.set(
                {
                    fulfillmentStatus: 'fulfilled',
                    fulfilledAt: admin.firestore.Timestamp.now(),
                    updatedAt: admin.firestore.Timestamp.now(),
                },
                { merge: true }
            );
        } catch (error) {
            await orderRef.set(
                {
                    fulfillmentStatus: 'failed',
                    fulfillmentError: error.message,
                    updatedAt: admin.firestore.Timestamp.now(),
                },
                { merge: true }
            );
            throw error;
        }

    } catch (error) {
        console.error('Error handling successful payment:', error);
        // Store order with failed process status
        await storeFailedOrder(paymentIntent, 'processing_error', error.message);
    }
}

export async function handlePaymentIntentFailed(paymentIntent) {
    try {
        console.log('Processing failed payment:', paymentIntent.id);
        const db = getAdminDb();

        const { userId, orderItems, itemCount } = paymentIntent.metadata;

        if (!userId) {
            console.error('Missing userId in failed payment metadata');
            return;
        }

        let parsedItems = [];
        try {
            parsedItems = JSON.parse(orderItems || '[]');
        } catch (error) {
            console.error('Failed to parse order items in failed payment:', error);
        }

        // Store failed order in same collection with process status
        const failedOrderData = {
            orderId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            userId: userId,

            // Process status for failed payments
            processStatus: 'failed',
            paymentStatus: paymentIntent.status,

            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            items: parsedItems,
            itemCount: parseInt(itemCount || '0'),

            failureReason: paymentIntent.last_payment_error?.message || 'Unknown payment error',

            createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
            updatedAt: admin.firestore.Timestamp.now(),
            failedAt: admin.firestore.Timestamp.now(),

            stripeData: {
                lastPaymentError: paymentIntent.last_payment_error,
                livemode: paymentIntent.livemode
            }
        };

        // Store in same orders collection
        const orderRef = db.collection('orders').doc(paymentIntent.id);
        await orderRef.set(failedOrderData, { merge: true });

        console.log(`Failed payment ${paymentIntent.id} stored with status 'failed' for user ${userId}`);

    } catch (error) {
        console.error('Error handling failed payment:', error);
    }
}

export async function handlePaymentIntentRequiresAction(paymentIntent) {
    try {
        console.log('Processing payment that requires action:', paymentIntent.id);
        const db = getAdminDb();

        const { userId, orderItems, itemCount } = paymentIntent.metadata;

        if (!userId) {
            console.error('Missing userId in payment requires action metadata');
            return;
        }

        let parsedItems = [];
        try {
            parsedItems = JSON.parse(orderItems || '[]');
        } catch (error) {
            console.error('Failed to parse order items in requires action payment:', error);
        }

        // Get action type from next_action
        const actionType = paymentIntent.next_action?.type || 'unknown';
        const actionData = paymentIntent.next_action || {};

        // Create/update order with pending status
        const pendingOrderData = {
            orderId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            userId: userId,

            // Process status for payments requiring action
            processStatus: 'pending',
            paymentStatus: paymentIntent.status, // 'requires_action'

            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            items: parsedItems,
            itemCount: parseInt(itemCount || '0'),

            // Action details
            requiresAction: true,
            actionType: actionType, // 'use_stripe_sdk', 'redirect_to_url', etc.
            actionData: actionData,

            createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
            updatedAt: admin.firestore.Timestamp.now(),
            pendingAt: admin.firestore.Timestamp.now(),

            // Payment method info
            paymentMethodId: paymentIntent.payment_method,
            paymentMethodTypes: paymentIntent.payment_method_types,

            stripeData: {
                clientSecret: paymentIntent.client_secret,
                nextAction: paymentIntent.next_action,
                livemode: paymentIntent.livemode
            }
        };

        // Store/update order in orders collection
        const orderRef = db.collection('orders').doc(paymentIntent.id);

        // Check if order already exists to preserve creation timestamp
        const existingOrder = await orderRef.get();
        if (existingOrder.exists) {
            // Update existing order, preserve createdAt
            await orderRef.update({
                processStatus: 'pending',
                paymentStatus: paymentIntent.status,
                requiresAction: true,
                actionType: actionType,
                actionData: actionData,
                updatedAt: admin.firestore.Timestamp.now(),
                pendingAt: admin.firestore.Timestamp.now(),
                stripeData: pendingOrderData.stripeData
            });
            console.log(`Updated existing order ${paymentIntent.id} with 'pending' status - requires ${actionType}`);
        } else {
            // Create new order
            await orderRef.set(pendingOrderData);
            console.log(`Created new order ${paymentIntent.id} with 'pending' status - requires ${actionType}`);
        }

    } catch (error) {
        console.error('Error handling payment requires action:', error);
        // Store order with error status
        await storeFailedOrder(paymentIntent, 'processing_error', `Requires action processing error: ${error.message}`);
    }
}

async function storeFailedOrder(paymentIntent, processStatus, errorMessage) {
    try {
        const db = getAdminDb();
        const { userId, orderItems, itemCount } = paymentIntent.metadata;

        let parsedItems = [];
        try {
            parsedItems = JSON.parse(orderItems || '[]');
        } catch (error) {
            console.error('Failed to parse order items:', error);
        }

        const errorOrderData = {
            orderId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            userId: userId || 'unknown',

            processStatus: processStatus, // 'processing_error', 'failed', etc.
            paymentStatus: paymentIntent.status,

            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            items: parsedItems,
            itemCount: parseInt(itemCount || '0'),

            errorMessage: errorMessage,

            createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
            updatedAt: admin.firestore.Timestamp.now(),
            errorAt: admin.firestore.Timestamp.now(),
        };

        await db.collection('orders').doc(paymentIntent.id).set(errorOrderData, { merge: true });
        console.log(`Error order ${paymentIntent.id} stored with status '${processStatus}'`);

    } catch (error) {
        console.error('Failed to store error order:', error);
    }
}
