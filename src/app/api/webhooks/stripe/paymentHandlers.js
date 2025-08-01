import admin from 'firebase-admin';


// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const db = admin.firestore();

export async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        console.log('Processing successful payment:', paymentIntent.id);

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
        console.log("OrderData:", orderData)
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
            items: parsedItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                withFees: item.withFees || false
            })),
            itemCount: parseInt(itemCount),

            // Timestamps
            createdAt: admin.firestore.Timestamp.fromMillis(paymentIntent.created * 1000),
            updatedAt: admin.firestore.Timestamp.now(),
            completedAt: admin.firestore.Timestamp.now(),

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
        console.log("OrderData:", orderData)
        // Store order in single orders collection
        try {
            console.log("Saving sucessfull order")
            const orderRef = db.collection('orders').doc(paymentIntent.id);
            await orderRef.update(orderData);
        }catch (error){
            console.log("Erro on saving sucessfull order:", error)
            throw error
        }
        

        

        console.log(`Order ${paymentIntent.id} successfully stored with status 'completed' for user ${userId}`);
        await createUserProducts(paymentIntent.id, userId, parsedItems);
        // Optional: Update product inventory
        await updateProductInventory(parsedItems);

    } catch (error) {
        console.error('Error handling successful payment:', error);
        // Store order with failed process status
        await storeFailedOrder(paymentIntent, 'processing_error', error.message);
    }
}

export async function handlePaymentIntentFailed(paymentIntent) {
    try {
        console.log('Processing failed payment:', paymentIntent.id);

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
        await orderRef.set(failedOrderData);

        console.log(`Failed payment ${paymentIntent.id} stored with status 'failed' for user ${userId}`);

    } catch (error) {
        console.error('Error handling failed payment:', error);
    }
}

export async function handlePaymentIntentRequiresAction(paymentIntent) {
    try {
        console.log('Processing payment that requires action:', paymentIntent.id);

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

        await db.collection('orders').doc(paymentIntent.id).set(errorOrderData);
        console.log(`Error order ${paymentIntent.id} stored with status '${processStatus}'`);

    } catch (error) {
        console.error('Failed to store error order:', error);
    }
}

async function updateProductInventory(items) {
    try {
        const batch = db.batch();

        for (const item of items) {
            const productRef = db.collection('shop').doc(item.id);
            batch.update(productRef, {
                soldCount: admin.firestore.FieldValue.increment(item.quantity),
                lastSoldAt: admin.firestore.Timestamp.now()
            });
        }

        await batch.commit();
        console.log('Product inventory updated successfully');

    } catch (error) {
        console.error('Error updating product inventory:', error);
        // Don't throw - inventory update failure shouldn't fail the webhook
    }
}

async function createUserProducts(orderId, userId, orderItems) {
    try {
        const batch = db.batch();

        for (const item of orderItems) {
            // Get full product details from products collection
            const productDoc = await db.collection('shop').doc(item.id).get();

            if (!productDoc.exists) {
                console.error(`Shop Item ${item.id} not found`);
                continue;
            }

            const product = productDoc.data();

            // Skip non-ticket products (they don't need special handling)
            // TODO: this will be handled in the future
            /*  if (product.category !== 'tickets') {
               // For merchandise, just create a simple user product record
               await createSimpleUserProduct(batch, orderId, userId, product, item);
               continue;
             } */

            // Handle ticket products - create one user product per quantity
            const productsRefs = await Promise.all(product.products.map(ref => ref.get()));
            console.log("Sucessufully getting all productRef from shopItems");
            for (let i = 0; i < item.quantity; i++) {
                //if (product.type === 'single_ticket') {
                await createTicketUserProduct(batch, orderId, userId, product, productsRefs, item, i + 1);
                /* } else if (product.type === 'ticket_package') {
                  await createPackageUserProduct(batch, orderId, userId, product, item, i + 1);
                } */
            }
        }

        await batch.commit();
        console.log(`Created user products for order ${orderId}`);

    } catch (error) {
        console.error('Error creating user products:', error);
        throw error;
    }

}

async function createTicketUserProduct(batch, orderId, userId, product, productsRefs, item, sequence) {
    const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let subsequence = 0
    for (const productDoc of productsRefs) {
        if (productDoc.exists()) {
            const productData = productDoc.data();
            const orderSlice = orderId.slice(-6).toUpperCase()
            const userProductId = `USRPRD-${orderSlice}-${productData.name}-${dateString}${sequence}`
            const productRef = db.collection('userProducts').doc(userId).collection('products').doc(userProductId)
            if (productData.category == "ticket") {

                const ticketNumber = `TCKT-${orderSlice}${userId}${dateString}${sequence}${subsequence}`
                const ticketRef = db.collection('tickets').doc(ticketNumber);
                console.log("Saving ticket on ref", ticketRef)
                const product = {
                    userId: userId,
                    userProductIdRef: userProductId,
                    status: 'active',
                    validationSecret: generateValidationSecret(),
                    valid: true,
                    ticketNumber: ticketNumber,
                    ticketId: productData.id,
                    validForm: productData.validFrom,
                    validUntil: productData.validUntil,
                    eventId: productData.eventId,
                    category: product.category
                }
                
                batch.set(ticketRef, {
                    userId: userId,
                    userProductIdRef: userProductId,
                    status: 'active',
                    validationSecret: generateValidationSecret(),
                    valid: true,
                    ticketNumber: ticketNumber,
                    ticketIdRef: productData.id,
                    validForm: productData.validFrom,
                    validUntil: productData.validUntil,
                    eventId: productData.eventId,
                    category: product.category
                })
                console.log("Saving user Product on ref", productRef)
                batch.set(productRef, {
                    userId: userId,
                    userProductIdRef: userProductId,
                    status: 'active',
                    validationSecret: generateValidationSecret(),
                    valid: true,
                    ticketNumberRef: ticketNumber,
                    productIdRef: productData.id,
                    validForm: productData.validFrom,
                    validUntil: productData.validUntil,
                    eventId: productData.eventId,
                    category: product.category
                })
            }
            else {
                console.log("Saving user Product on ref", productRef)
                batch.set(productRef, {
                    userId: userId,
                    userProductIdRef: userProductId,
                    status: 'active',
                    validationSecret: generateValidationSecret(),
                    valid: true,
                    productId: productData.id,
                    eventId: productData.eventId,
                    category: product.category
                })
            }
        }

    }
}




function generateTicketNumber(ticketId, eventDate, suffix = '') {
    const eventCode = eventId.toUpperCase().slice(0, 6);
    const dateStr = new Date(eventDate).toISOString().slice(0, 10).replace(/-/g, '');
    const ticketSeq = ticketId.slice(-6).toUpperCase();
    const suffixStr = suffix ? `-${suffix}` : '';

    return `${eventCode}-${ticketSeq}-${dateStr}${suffixStr}`;
}
function generateQRCodeData(ticketId, userId, eventDate, ticketLevel) {
    const components = [
        eventId.toUpperCase(),
        ticketId,
        userId.slice(-8),
        new Date(eventDate).toISOString().slice(0, 10).replace(/-/g, ''),
        ticketLevel
    ];

    if (packageType) {
        components.push(packageType);
    }

    return components.join('|');
}

function generateValidationSecret() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'vld_';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}